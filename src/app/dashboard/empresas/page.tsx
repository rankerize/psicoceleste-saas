'use client';

import { useState, useEffect } from 'react';
import {
  Building2, Plus, Search, Edit2, Trash2, Users, ChevronRight,
  MapPin, Phone, Mail, Hash, Globe, X, Check, AlertCircle, Loader2,
  Upload, FileText, CheckCircle2, Download, ArrowRight
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import {
  collection, addDoc, updateDoc, deleteDoc, doc, query,
  where, getDocs, getDoc, serverTimestamp, Timestamp, getCountFromServer
} from 'firebase/firestore';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Sector =
  | 'servicios' | 'industria' | 'comercio' | 'agricola'
  | 'salud' | 'educacion' | 'construccion' | 'transporte'
  | 'tecnologia' | 'financiero' | 'otro';

interface Empresa {
  id: string;
  nombre: string;
  nit: string;
  sector: Sector;
  ciudad: string;
  departamento: string;
  telefono: string;
  email: string;
  cantidadEmpleados: number;
  contactoNombre: string;
  creadoEn: Timestamp;
  totalBaterias?: number;
}

const SECTORES: { value: Sector; label: string }[] = [
  { value: 'servicios',     label: 'Servicios' },
  { value: 'industria',     label: 'Industria' },
  { value: 'comercio',      label: 'Comercio' },
  { value: 'agricola',      label: 'Agrícola' },
  { value: 'salud',         label: 'Salud' },
  { value: 'educacion',     label: 'Educación' },
  { value: 'construccion',  label: 'Construcción' },
  { value: 'transporte',    label: 'Transporte' },
  { value: 'tecnologia',    label: 'Tecnología' },
  { value: 'financiero',    label: 'Financiero' },
  { value: 'otro',          label: 'Otro' },
];

const DEPARTAMENTOS = [
  'Amazonas','Antioquia','Arauca','Atlántico','Bolívar','Boyacá','Caldas',
  'Caquetá','Casanare','Cauca','Cesar','Chocó','Córdoba','Cundinamarca',
  'Guainía','Guaviare','Huila','La Guajira','Magdalena','Meta','Nariño',
  'Norte de Santander','Putumayo','Quindío','Risaralda','San Andrés y Providencia',
  'Santander','Sucre','Tolima','Valle del Cauca','Vaupés','Vichada',
];

const EMPTY_FORM = {
  nombre: '', nit: '', sector: 'servicios' as Sector, ciudad: '',
  departamento: 'Cundinamarca', telefono: '', email: '',
  cantidadEmpleados: 0, contactoNombre: '',
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function EmpresasPage() {
  const { user } = useAuth();
  const [empresas, setEmpresas]     = useState<Empresa[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');

  // Wizard states
  const [showModal, setShowModal]   = useState(false);
  const [step, setStep]             = useState<1 | 2 | 3>(1);
  const [empresaReciente, setEmpresaReciente] = useState<{id: string, nombre: string} | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [empleadosAgregados, setEmpleadosAgregados] = useState(0);
  const [successMsg, setSuccessMsg] = useState('');

  const [editando, setEditando]     = useState<Empresa | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [form, setForm]             = useState(EMPTY_FORM);

  // ── Cargar empresas ──────────────────────────────────────────────────────────
  const cargarEmpresas = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'empresas'), where('psicologo', '==', user.uid));
      const snap = await getDocs(q);
      
      const loadedEmpresas = await Promise.all(snap.docs.map(async d => {
        const empData = d.data() as Empresa;
        
        // Contar el número real de empleados registrados
        const qEmps = query(collection(db, 'empleados'), where('empresaId', '==', d.id));
        const countSnap = await getCountFromServer(qEmps);
        const actualCount = countSnap.data().count;
        
        // Aquí podríamos iterar sobre resultados para contar baterías, pero como 
        // optimización dejemos cantidad real de emp vs form.
        return { 
          ...empData,
          id: d.id, 
          cantidadEmpleados: actualCount // SOBRESCRIBE el número estimado del form con la data REAL!
        } as Empresa;
      }));
      
      setEmpresas(loadedEmpresas.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    } catch {
      setError('Error al cargar empresas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarEmpresas(); }, [user]);

  // ── Abrir modal nuevo ───────────────────────────────────────────────────────
  const abrirNuevas = () => {
    setForm(EMPTY_FORM);
    setEditando(null);  
    setStep(1);
    setEmpresaReciente(null);
    setEmpleadosAgregados(0);
    setSuccessMsg('');
    setError('');
    setShowModal(true);
  };

  // ── Abrir modal edición ───────────────────────────────────────────────────────
  const abrirEdicion = (emp: Empresa) => {
    setEditando(emp);
    setForm({
      nombre: emp.nombre, nit: emp.nit, sector: emp.sector,
      ciudad: emp.ciudad, departamento: emp.departamento,
      telefono: emp.telefono, email: emp.email,
      cantidadEmpleados: emp.cantidadEmpleados, contactoNombre: emp.contactoNombre,
    });
    setStep(1);
    setEmpresaReciente(null);
    setEmpleadosAgregados(0);
    setSuccessMsg('');
    setError('');
    setShowModal(true);
  };

  // ── Guardar (crear o editar) ──────────────────────────────────────────────────
  const onGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.nombre || !form.nit) { setError('Nombre y NIT son obligatorios'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, psicologo: user.uid };
      let newEmpId = '';
      if (editando) {
        await updateDoc(doc(db, 'empresas', editando.id), payload);
        newEmpId = editando.id;
      } else {
        const docRef = await addDoc(collection(db, 'empresas'), {
          ...payload,
          totalBaterias: 0,
          creadoEn: serverTimestamp(),
        });
        newEmpId = docRef.id;
      }
      
      setEmpresaReciente({ id: newEmpId, nombre: payload.nombre });
      setStep(2); // Avanzar a éxito
      setForm(EMPTY_FORM);
      await cargarEmpresas();
    } catch {
      setError('Error al guardar. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  // ── Importar CSV Empleados ────────────────────────────────────────────────────
  const onImportarCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !empresaReciente || !user) return;
    setCsvLoading(true);
    setError('');
    setSuccessMsg('');
    
    try {
      const text = await file.text();
      const lines = text.trim().split('\n').slice(1);
      let imported = 0;
      let failed = 0;
      
      for (const line of lines) {
        if (!line.trim()) continue;
        const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length < 2) { failed++; continue; }
        const [nombre, apellido, cedula, cargo = '', area = ''] = cols;
        const nombreComp = apellido ? `${nombre} ${apellido}`.trim() : nombre;
        if (!cedula || !nombreComp) { failed++; continue; }
        
        try {
          await addDoc(collection(db, 'empleados'), {
            cedula, 
            nombre: nombreComp, 
            cargo,
            tipoCargo: 'auxiliar', // Default
            area, 
            email: '', 
            telefono: '',
            empresaId: empresaReciente.id, 
            psicologo: user.uid,
            estadoBateria: 'pendiente',
            creadoEn: serverTimestamp(),
          });
          imported++;
        } catch { failed++; }
      }
      setEmpleadosAgregados(prev => prev + imported);
      if (failed > 0) {
         setError(`${imported} empleados importados, ${failed} fallaron (revisa el formato).`);
      } else if (imported > 0) {
         setSuccessMsg(`¡${imported} empleados importados correctamente!`);
      } else {
         setError('No se encontraron empleados válidos en el archivo.');
      }
      await cargarEmpresas();
    } catch (err) {
      setError('Error leyendo el archivo CSV.');
    } finally {
      setCsvLoading(false);
      e.target.value = ''; // Reset input
    }
  };

  const descargarPlantilla = () => {
    const content = 'Nombre,Apellido,Cédula,Cargo,Área\nJuan,Pérez,1234567890,Analista,Recursos Humanos\n';
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_empleados.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Eliminar ──────────────────────────────────────────────────────────────────
  const onEliminar = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'empresas', id));
      setConfirmDelete(null);
      await cargarEmpresas();
    } catch {
      setError('Error al eliminar empresa');
    }
  };

  const filtradas = empresas.filter(e =>
    e.nombre.toLowerCase().includes(search.toLowerCase()) ||
    e.nit.includes(search) ||
    e.ciudad.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Building2 className="text-sky-400" size={28} />
            Empresas Clientes
          </h1>
          <p className="text-slate-400 mt-1">
            {empresas.length} empresa{empresas.length !== 1 ? 's' : ''} registrada{empresas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          id="btn-nueva-empresa"
          onClick={abrirNuevas}
          className="btn-primary flex items-center gap-2 self-start"
        >
          <Plus size={18} />
          Nueva Empresa
        </button>
      </div>

      {/* Búsqueda */}
      <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-2 mb-8 mt-4 relative z-20 shadow-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              id="search-empresas"
              type="text"
              placeholder="Buscar por nombre, NIT o ciudad..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '3rem' }}
              className="w-full bg-transparent border-none text-white pr-4 py-3 focus:outline-none focus:ring-0 placeholder-slate-500"
            />
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-sky-400" size={36} />
        </div>
      ) : filtradas.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Building2 className="mx-auto text-slate-600 mb-4" size={48} />
          <p className="text-slate-300 text-lg font-medium">
            {search ? 'No hay resultados para tu búsqueda' : 'Aún no tienes empresas registradas'}
          </p>
          {!search && (
            <p className="text-slate-500 mt-2 mb-6">
              Registra tu primera empresa cliente para comenzar a aplicar la batería.
            </p>
          )}
          {!search && (
            <button onClick={abrirNuevas} className="btn-primary">
              <Plus size={16} className="inline mr-2" /> Registrar primera empresa
            </button>
          )}
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden mt-6 border border-white/10">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm text-left whitespace-nowrap" style={{ borderSpacing: 0 }}>
              <thead className="text-xs text-slate-400 bg-slate-800/80 uppercase border-b border-white/10">
                <tr>
                  <th style={{ padding: '1.25rem 2rem' }} className="font-bold tracking-wider">Empresa / NIT</th>
                  <th style={{ padding: '1.25rem 2rem' }} className="font-bold tracking-wider">Sector</th>
                  <th style={{ padding: '1.25rem 2rem' }} className="font-bold tracking-wider">Ubicación</th>
                  <th style={{ padding: '1.25rem 2rem' }} className="font-bold tracking-wider">Contacto</th>
                  <th style={{ padding: '1.25rem 2rem' }} className="font-bold tracking-wider text-center">Empleados</th>
                  <th style={{ padding: '1.25rem 2rem' }} className="font-bold tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map(emp => (
                  <tr key={emp.id} className="border-b border-white/10 hover:bg-slate-800/40 transition-colors">
                    {/* Empresa y NIT */}
                    <td style={{ padding: '1.25rem 2rem' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-violet-500/20 border border-sky-500/20 flex items-center justify-center shrink-0">
                          <Building2 className="text-sky-400" size={18} />
                        </div>
                        <div>
                          <div className="font-bold text-white text-base">{emp.nombre}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">NIT: {emp.nit}</div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Sector */}
                    <td style={{ padding: '1.25rem 2rem' }}>
                      <span className="text-xs px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                        {SECTORES.find(s => s.value === emp.sector)?.label ?? emp.sector}
                      </span>
                    </td>

                    {/* Ubicación */}
                    <td style={{ padding: '1.25rem 2rem' }}>
                      <div className="flex items-center gap-2 text-slate-300">
                        <MapPin size={14} className="text-slate-500" />
                        <span>{emp.ciudad || 'N/A'}, {emp.departamento || '-'}</span>
                      </div>
                    </td>

                    {/* Contacto */}
                    <td style={{ padding: '1.25rem 2rem' }} className="space-y-1">
                      {emp.email && (
                        <div className="flex items-center gap-2 text-slate-400 text-xs">
                          <Mail size={13} className="text-slate-500" /> {emp.email}
                        </div>
                      )}
                      {emp.telefono && (
                        <div className="flex items-center gap-2 text-slate-400 text-xs">
                          <Phone size={13} className="text-slate-500" /> {emp.telefono}
                        </div>
                      )}
                      {!emp.email && !emp.telefono && <span className="text-slate-600 text-xs">-</span>}
                    </td>

                    {/* Estadísticas */}
                    <td style={{ padding: '1.25rem 2rem' }} className="text-center">
                      <div className="inline-flex items-center gap-4 bg-slate-900/50 px-4 py-2 rounded-xl border border-white/5">
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Emp.</span>
                          <span className="text-sky-400 font-bold flex items-center gap-1 text-sm">
                            <Users size={12} /> {emp.cantidadEmpleados}
                          </span>
                        </div>
                        <div className="w-px h-6 bg-slate-700"></div>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Bats.</span>
                          <span className="text-emerald-400 font-bold flex items-center gap-1 text-sm">
                            <Hash size={12} /> {emp.totalBaterias ?? 0}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Acciones */}
                    <td style={{ padding: '1.25rem 2rem' }}>
                      <div className="flex items-center justify-end gap-2 text-sm">
                        <button 
                          onClick={() => abrirEdicion(emp)} 
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all" 
                          title="Editar empresa"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setConfirmDelete(emp.id)} 
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-all" 
                          title="Eliminar empresa"
                        >
                          <Trash2 size={16} />
                        </button>
                        <a 
                          href={`/dashboard/empresas/${emp.id}`} 
                          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold transition-all shadow-md shadow-sky-500/20 flex items-center gap-2 ml-2"
                        >
                          Empleados <ArrowRight size={14} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Wizard Modal (Nueva / Editar / Éxito / Importar) ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => step === 1 && setShowModal(false)} />
          <div className="relative z-10 glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {step === 1 && <><Building2 className="text-sky-400" size={20} /> {editando ? 'Editar Empresa' : 'Nueva Empresa Cliente'}</>}
                {step === 2 && <><CheckCircle2 className="text-emerald-400" size={20} /> ¡Éxito!</>}
                {step === 3 && <><Users className="text-violet-400" size={20} /> Cargar Empleados</>}
              </h2>
              {step !== 2 && (
                 <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                   <X size={18} />
                 </button>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-300 px-3 py-2 rounded-lg text-sm mb-4">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            
            {successMsg && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-3 py-2 rounded-lg text-sm mb-4">
                <CheckCircle2 size={16} /> {successMsg}
              </div>
            )}

            {/* STEP 1: FORMULARIO DE EMPRESA */}
            {step === 1 && (
              <form onSubmit={onGuardar} className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm text-slate-300 mb-1">Nombre de la empresa *</label>
                    <div className="relative flex items-center">
                       <input type="text" required value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className="input-field w-full pr-10" placeholder="Ej: Construcciones ABC S.A.S." />
                       {form.nombre.length > 2 && <Check className="absolute right-3 text-emerald-400" size={16} />}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-1">NIT *</label>
                    <div className="relative flex items-center">
                      <Hash className="absolute left-3 text-slate-400" size={15} />
                      <input type="text" required value={form.nit} onChange={e => setForm(f => ({ ...f, nit: e.target.value }))} className="input-field w-full pl-10 pr-10" placeholder="900.123.456-7" />
                      {form.nit.length > 5 && <Check className="absolute right-3 text-emerald-400" size={16} />}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Sector económico</label>
                    <div className="relative flex items-center">
                      <select value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value as Sector }))} className="input-field w-full cursor-pointer pr-10">
                        {SECTORES.map(s => <option key={s.value} value={s.value} className="bg-slate-800 text-white">{s.label}</option>)}
                      </select>
                      {form.sector && <Check className="absolute right-3 text-emerald-400 pointer-events-none" size={16} />}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Ciudad</label>
                    <div className="relative flex items-center">
                      <MapPin className="absolute left-3 text-slate-400" size={15} />
                      <input type="text" value={form.ciudad} onChange={e => setForm(f => ({ ...f, ciudad: e.target.value }))} className="input-field w-full pl-10 pr-10" placeholder="Bogotá" />
                      {form.ciudad.length > 2 && <Check className="absolute right-3 text-emerald-400" size={16} />}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Departamento</label>
                    <div className="relative flex items-center">
                      <select value={form.departamento} onChange={e => setForm(f => ({ ...f, departamento: e.target.value }))} className="input-field w-full cursor-pointer pr-10">
                        {DEPARTAMENTOS.map(d => <option key={d} value={d} className="bg-slate-800 text-white">{d}</option>)}
                      </select>
                      {form.departamento && <Check className="absolute right-3 text-emerald-400 pointer-events-none" size={16} />}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Teléfono</label>
                    <div className="relative flex items-center">
                      <Phone className="absolute left-3 text-slate-400" size={15} />
                      <input type="tel" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} className="input-field w-full pl-10 pr-10" placeholder="+57 300 123 4567" />
                      {form.telefono.length > 6 && <Check className="absolute right-3 text-emerald-400" size={16} />}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Email de contacto</label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3 text-slate-400" size={15} />
                      <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-field w-full pl-10 pr-10" placeholder="rrhh@empresa.com" />
                      {(form.email.includes('@') && form.email.includes('.')) && <Check className="absolute right-3 text-emerald-400" size={16} />}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Número de empleados (Aprox)</label>
                    <div className="relative flex items-center">
                      <Users className="absolute left-3 text-slate-400" size={15} />
                      <input type="number" min={1} value={form.cantidadEmpleados || ''} onChange={e => setForm(f => ({ ...f, cantidadEmpleados: parseInt(e.target.value) || 0 }))} className="input-field w-full pl-10 pr-10" placeholder="50" />
                      {form.cantidadEmpleados > 0 && <Check className="absolute right-3 text-emerald-400" size={16} />}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Nombre del contacto</label>
                    <div className="relative flex items-center">
                       <input type="text" value={form.contactoNombre} onChange={e => setForm(f => ({ ...f, contactoNombre: e.target.value }))} className="input-field w-full pr-10" placeholder="Ej: María López (RRHH)" />
                       {form.contactoNombre.length > 2 && <Check className="absolute right-3 text-emerald-400" size={16} />}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {saving ? <><Loader2 size={16} className="animate-spin" /> Guardando...</> : <><Check size={16} /> {editando ? 'Actualizar' : 'Crear Empresa'}</>}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: ÉXITO */}
            {step === 2 && (
               <div className="py-8 text-center animate-fade-in-up">
                 <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 glow-celeste">
                   <CheckCircle2 size={40} />
                 </div>
                 <h2 className="text-2xl font-bold text-white mb-2">¡Empresa {editando ? 'actualizada' : 'creada'} con éxito!</h2>
                 <p className="text-slate-400 mb-8 max-w-sm mx-auto">
                    {editando 
                      ? "Los datos de la empresa se han actualizado correctamente." 
                      : `La empresa ${empresaReciente?.nombre} ha sido registrada.`
                    } 
                    {(!editando || empleadosAgregados === 0) && " A continuación, puedes cargar los empleados."}
                 </p>
                 <div className="flex gap-4 justify-center">
                   <button onClick={() => setShowModal(false)} className="btn-secondary">
                      Salir al Listado
                   </button>
                   <button onClick={() => setStep(3)} className="btn-primary flex items-center gap-2">
                      Continuar a Empleados <ArrowRight size={16} />
                   </button>
                 </div>
               </div>
            )}

            {/* STEP 3: CARGA DE EMPLEADOS */}
            {step === 3 && (
               <div className="animate-fade-in-up">
                 <div className="bg-slate-800/50 rounded-xl p-5 border border-white/10 mb-6 text-center">
                   <Building2 className="mx-auto text-sky-400 mb-3" size={32} />
                   <h3 className="text-lg font-bold text-white mb-1">{empresaReciente?.nombre}</h3>
                   <p className="text-sm text-slate-400">Total empleados cargados: <span className="text-white font-bold">{empleadosAgregados}</span></p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Carga por CSV */}
                    <div className="glass-card p-6 border-dashed border-2 hover:border-violet-500/50 transition-colors text-center group">
                      <div className="w-12 h-12 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <FileText className="text-violet-400" size={24} />
                      </div>
                      <h4 className="text-white font-medium mb-2">Subida masiva por CSV</h4>
                      <p className="text-xs text-slate-400 mb-6 line-clamp-2">
                        Sube un archivo .csv con: Nombre, Apellido, Cédula, Cargo, Área.
                      </p>
                      
                      <label className="btn-primary flex items-center justify-center gap-2 cursor-pointer w-full text-sm py-2 px-4 rounded-xl">
                        {csvLoading ? <><Loader2 size={15} className="animate-spin" /> Procesando...</> : <><Upload size={15} /> Seleccionar Archivo</>}
                        <input type="file" accept=".csv" className="hidden" onChange={onImportarCSV} disabled={csvLoading} />
                      </label>
                      <button type="button" onClick={descargarPlantilla} className="text-xs text-sky-400 hover:text-sky-300 mt-4 flex items-center justify-center gap-1 w-full transition-colors">
                        <Download size={13} /> Descargar plantilla base
                      </button>
                    </div>

                    {/* Carga Manual (Aviso) */}
                    <div className="glass-card p-6 flex flex-col justify-center items-center text-center">
                       <Users className="text-slate-500 mb-4" size={32} />
                       <h4 className="text-white font-medium mb-2">Carga Manual</h4>
                       <p className="text-xs text-slate-400 mb-6">
                         Agrega empleados formulario por formulario, ideal para equipos pequeños o ajustes de último minuto.
                       </p>
                       <a href={`/dashboard/empresas/${empresaReciente?.id}`} className="btn-secondary text-sm w-full py-2 rounded-xl">
                         Ir al Panel de Empleados
                       </a>
                    </div>
                 </div>

                 <div className="mt-6 text-center">
                    <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
                      Finalizar y cerrar ventana
                    </button>
                 </div>
               </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal Confirmar Eliminación ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative z-10 glass-card p-6 w-full max-w-sm text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="text-red-400" size={24} />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">¿Eliminar empresa?</h3>
            <p className="text-slate-400 text-sm mb-6">
              Esta acción es <span className="text-red-400 font-semibold">permanente</span> y eliminará todos los datos asociados a esta empresa.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={() => onEliminar(confirmDelete)} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-colors">
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
