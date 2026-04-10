'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users, Plus, Search, Edit2, Trash2, Upload, ChevronLeft,
  Hash, Briefcase, Phone, Mail, AlertCircle, Loader2, X, Check,
  ClipboardList, FileText, Building2, UserCheck
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import {
  collection, addDoc, updateDoc, deleteDoc, doc, query,
  where, getDocs, getDoc, serverTimestamp, Timestamp
} from 'firebase/firestore';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TipoCargo = 'jefatura' | 'profesional' | 'tecnico' | 'auxiliar' | 'operario';
type EstadoBateria = 'pendiente' | 'en_proceso' | 'completado';

interface Empleado {
  id: string;
  cedula: string;
  nombre: string;
  cargo: string;
  tipoCargo: TipoCargo;
  area: string;
  email: string;
  telefono: string;
  empresaId: string;
  estadoBateria: EstadoBateria;
  creadoEn: Timestamp;
}

interface Empresa {
  id: string;
  nombre: string;
  nit: string;
}

const TIPOS_CARGO: { value: TipoCargo; label: string; forma: string }[] = [
  { value: 'jefatura',     label: 'Jefatura / Dirección',      forma: 'A' },
  { value: 'profesional',  label: 'Profesional / Analista',    forma: 'A' },
  { value: 'tecnico',      label: 'Técnico / Tecnólogo',       forma: 'A' },
  { value: 'auxiliar',     label: 'Auxiliar / Asistente',      forma: 'B' },
  { value: 'operario',     label: 'Operario / Servicios',      forma: 'B' },
];

const ESTADO_LABELS: Record<EstadoBateria, { label: string; color: string }> = {
  pendiente:   { label: 'Pendiente',   color: 'bg-slate-500/20 text-slate-300' },
  en_proceso:  { label: 'En proceso',  color: 'bg-amber-500/20 text-amber-300' },
  completado:  { label: 'Completado',  color: 'bg-emerald-500/20 text-emerald-300' },
};

const EMPTY_FORM = {
  cedula: '', nombre: '', cargo: '', tipoCargo: 'auxiliar' as TipoCargo,
  area: '', email: '', telefono: '',
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function EmpleadosPage() {
  const { user } = useAuth();
  const params = useParams();
  const empresaId = params.empresaId as string;

  const [empresa, setEmpresa]       = useState<Empresa | null>(null);
  const [empleados, setEmpleados]   = useState<Empleado[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoBateria | 'todos'>('todos');
  const [showModal, setShowModal]   = useState(false);
  const [editando, setEditando]     = useState<Empleado | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [form, setForm]             = useState(EMPTY_FORM);
  const [csvLoading, setCsvLoading] = useState(false);

  // ── Cargar empresa y empleados ────────────────────────────────────────────────

  const cargarDatos = useCallback(async () => {
    if (!user || !empresaId) return;
    setLoading(true);
    try {
      // Empresa
      const empDoc = await getDoc(doc(db, 'empresas', empresaId));
      if (empDoc.exists()) setEmpresa({ id: empDoc.id, ...empDoc.data() } as Empresa);

      // Empleados
      const q = query(collection(db, 'empleados'), where('empresaId', '==', empresaId));
      const snap = await getDocs(q);
      const datos = snap.docs.map(d => ({ id: d.id, ...d.data() } as Empleado));
      setEmpleados(datos.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    } catch {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [user, empresaId]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  // ── Guardar empleado ──────────────────────────────────────────────────────────

  const onGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cedula || !form.nombre) { setError('Cédula y nombre son obligatorios'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, empresaId, psicologo: user!.uid };
      if (editando) {
        await updateDoc(doc(db, 'empleados', editando.id), payload);
      } else {
        await addDoc(collection(db, 'empleados'), {
          ...payload,
          estadoBateria: 'pendiente',
          creadoEn: serverTimestamp(),
        });
      }
      setShowModal(false);
      setEditando(null);
      setForm(EMPTY_FORM);
      await cargarDatos();
    } catch {
      setError('Error al guardar. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  // ── Eliminar ──────────────────────────────────────────────────────────────────

  const onEliminar = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'empleados', id));
      setConfirmDelete(null);
      await cargarDatos();
    } catch {
      setError('Error al eliminar');
    }
  };

  // ── Importar CSV ──────────────────────────────────────────────────────────────
  // Formato esperado: cedula,nombre,cargo,tipoCargo,area,email,telefono

  const onImportarCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvLoading(true);
    setError('');
    const text = await file.text();
    const lines = text.trim().split('\n').slice(1); // skip header
    let imported = 0;
    let failed = 0;
    for (const line of lines) {
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 2) { failed++; continue; }
      const [cedula, nombre, cargo = '', tipoCargo = 'auxiliar', area = '', email = '', telefono = ''] = cols;
      if (!cedula || !nombre) { failed++; continue; }
      try {
        await addDoc(collection(db, 'empleados'), {
          cedula, nombre, cargo,
          tipoCargo: (TIPOS_CARGO.find(t => t.value === tipoCargo) ? tipoCargo : 'auxiliar') as TipoCargo,
          area, email, telefono,
          empresaId, psicologo: user!.uid,
          estadoBateria: 'pendiente',
          creadoEn: serverTimestamp(),
        });
        imported++;
      } catch { failed++; }
    }
    setCsvLoading(false);
    e.target.value = '';
    await cargarDatos();
    if (failed > 0) setError(`${imported} importados, ${failed} fallaron.`);
  };

  // ── Filtrado ──────────────────────────────────────────────────────────────────

  const filtrados = empleados.filter(e => {
    const matchSearch =
      e.nombre.toLowerCase().includes(search.toLowerCase()) ||
      e.cedula.includes(search) ||
      e.cargo.toLowerCase().includes(search.toLowerCase());
    const matchEstado = filtroEstado === 'todos' || e.estadoBateria === filtroEstado;
    return matchSearch && matchEstado;
  });

  const stats = {
    total: empleados.length,
    pendiente: empleados.filter(e => e.estadoBateria === 'pendiente').length,
    en_proceso: empleados.filter(e => e.estadoBateria === 'en_proceso').length,
    completado: empleados.filter(e => e.estadoBateria === 'completado').length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link href="/dashboard/empresas" className="flex items-center gap-1 hover:text-sky-400 transition-colors">
          <ChevronLeft size={16} /> Empresas
        </Link>
        <span>/</span>
        <span className="text-white font-medium">{empresa?.nombre ?? 'Cargando...'}</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="text-sky-400" size={28} />
            Empleados
          </h1>
          {empresa && (
            <p className="text-slate-400 mt-1 flex items-center gap-1">
              <Building2 size={14} /> {empresa.nombre} — NIT {empresa.nit}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 self-start">
          {/* Importar CSV */}
          <label
            id="btn-importar-csv"
            className="btn-secondary flex items-center gap-2 cursor-pointer"
            title="Importar desde CSV (cedula,nombre,cargo,tipoCargo,area,email,telefono)"
          >
            {csvLoading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Importar CSV
            <input type="file" accept=".csv" className="hidden" onChange={onImportarCSV} />
          </label>
          <button
            id="btn-nuevo-empleado"
            onClick={() => { setForm(EMPTY_FORM); setEditando(null); setShowModal(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> Nuevo Empleado
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total',      val: stats.total,       color: 'text-sky-400',     icon: <Users size={16}/> },
          { label: 'Pendiente',  val: stats.pendiente,   color: 'text-slate-300',   icon: <ClipboardList size={16}/> },
          { label: 'En proceso', val: stats.en_proceso,  color: 'text-amber-400',   icon: <FileText size={16}/> },
          { label: 'Completado', val: stats.completado,  color: 'text-emerald-400', icon: <UserCheck size={16}/> },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 flex items-center gap-3">
            <div className={`${s.color} opacity-80`}>{s.icon}</div>
            <div>
              <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            id="search-empleados"
            type="text"
            placeholder="Buscar por nombre, cédula o cargo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9 w-full"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['todos', 'pendiente', 'en_proceso', 'completado'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltroEstado(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filtroEstado === f
                  ? 'bg-sky-500 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              {f === 'todos' ? 'Todos' : ESTADO_LABELS[f].label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl mb-6 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-sky-400" size={36} />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Users className="mx-auto text-slate-600 mb-4" size={48} />
          <p className="text-slate-300 text-lg font-medium">
            {search || filtroEstado !== 'todos' ? 'Sin resultados' : 'Aún no hay empleados registrados'}
          </p>
          {!search && filtroEstado === 'todos' && (
            <p className="text-slate-500 mt-2 mb-6">
              Agrega empleados manualmente o importa un archivo CSV.
            </p>
          )}
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Empleado</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium hidden md:table-cell">Cédula</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium hidden lg:table-cell">Cargo / Área</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Forma</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Estado</th>
                  <th className="text-right px-4 py-3 text-xs text-slate-400 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtrados.map(emp => {
                  const tipo = TIPOS_CARGO.find(t => t.value === emp.tipoCargo);
                  const estado = ESTADO_LABELS[emp.estadoBateria] ?? ESTADO_LABELS.pendiente;
                  return (
                    <tr key={emp.id} className="hover:bg-white/2 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0 text-sky-400 text-xs font-bold">
                            {emp.nombre.charAt(0)}
                          </div>
                          <div>
                            <div className="text-white font-medium text-sm">{emp.nombre}</div>
                            {emp.email && <div className="text-slate-500 text-xs">{emp.email}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 hidden md:table-cell">
                        <div className="flex items-center gap-1">
                          <Hash size={12} className="text-slate-600" /> {emp.cedula}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="text-white text-xs">{emp.cargo}</div>
                        <div className="text-slate-500 text-xs">{emp.area}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${
                          tipo?.forma === 'A'
                            ? 'bg-violet-500/20 text-violet-300'
                            : 'bg-cyan-500/20 text-cyan-300'
                        }`}>
                          Forma {tipo?.forma ?? '?'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-lg ${estado.color}`}>
                          {estado.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {emp.estadoBateria !== 'completado' && (
                            <Link
                              href={`/bateria/${emp.cedula}?empresaId=${empresaId}&empleadoId=${emp.id}`}
                              id={`btn-bateria-${emp.id}`}
                              className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                              title="Aplicar batería"
                            >
                              <ClipboardList size={14} />
                            </Link>
                          )}
                          <button
                            id={`btn-editar-emp-${emp.id}`}
                            onClick={() => {
                              setEditando(emp);
                              setForm({
                                cedula: emp.cedula, nombre: emp.nombre,
                                cargo: emp.cargo, tipoCargo: emp.tipoCargo,
                                area: emp.area, email: emp.email, telefono: emp.telefono,
                              });
                              setShowModal(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-sky-500/20 text-sky-400 transition-colors"
                            title="Editar empleado"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            id={`btn-eliminar-emp-${emp.id}`}
                            onClick={() => setConfirmDelete(emp.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                            title="Eliminar empleado"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal Nuevo / Editar Empleado ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative z-10 glass-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="text-sky-400" size={20} />
                {editando ? 'Editar Empleado' : 'Nuevo Empleado'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={onGuardar} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-300 px-3 py-2 rounded-lg text-sm">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Cédula */}
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Cédula *</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      id="input-cedula"
                      type="text"
                      required
                      value={form.cedula}
                      onChange={e => setForm(f => ({ ...f, cedula: e.target.value }))}
                      className="input-field w-full pl-9"
                      placeholder="1234567890"
                    />
                  </div>
                </div>

                {/* Tipo de cargo */}
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Tipo de cargo</label>
                  <select
                    id="select-tipo-cargo"
                    value={form.tipoCargo}
                    onChange={e => setForm(f => ({ ...f, tipoCargo: e.target.value as TipoCargo }))}
                    className="input-field w-full"
                  >
                    {TIPOS_CARGO.map(t => (
                      <option key={t.value} value={t.value}>{t.label} (Forma {t.forma})</option>
                    ))}
                  </select>
                </div>

                {/* Nombre completo */}
                <div className="col-span-2">
                  <label className="block text-sm text-slate-300 mb-1">Nombre completo *</label>
                  <input
                    id="input-nombre-empleado"
                    type="text"
                    required
                    value={form.nombre}
                    onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                    className="input-field w-full"
                    placeholder="Ej: María González Pérez"
                  />
                </div>

                {/* Cargo */}
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Nombre del cargo</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      id="input-cargo"
                      type="text"
                      value={form.cargo}
                      onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}
                      className="input-field w-full pl-9"
                      placeholder="Analista de RRHH"
                    />
                  </div>
                </div>

                {/* Área */}
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Área / Departamento</label>
                  <input
                    id="input-area"
                    type="text"
                    value={form.area}
                    onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                    className="input-field w-full"
                    placeholder="Recursos Humanos"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      id="input-email-empleado"
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="input-field w-full pl-9"
                      placeholder="empleado@empresa.com"
                    />
                  </div>
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      id="input-telefono-empleado"
                      type="tel"
                      value={form.telefono}
                      onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                      className="input-field w-full pl-9"
                      placeholder="+57 300 000 0000"
                    />
                  </div>
                </div>
              </div>

              {/* Info forma */}
              <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl px-4 py-3 text-xs text-sky-300">
                <strong>Forma {TIPOS_CARGO.find(t => t.value === form.tipoCargo)?.forma}:</strong>{' '}
                {['jefatura', 'profesional', 'tecnico'].includes(form.tipoCargo)
                  ? 'Cuestionario Intralaboral Forma A — 123 ítems'
                  : 'Cuestionario Intralaboral Forma B — 97 ítems'}
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button
                  id="btn-guardar-empleado"
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {saving
                    ? <><Loader2 size={15} className="animate-spin" /> Guardando...</>
                    : <><Check size={15} /> {editando ? 'Actualizar' : 'Registrar'}</>
                  }
                </button>
              </div>
            </form>
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
            <h3 className="text-white font-bold text-lg mb-2">¿Eliminar empleado?</h3>
            <p className="text-slate-400 text-sm mb-6">Se eliminarán todos sus datos y resultados de batería.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancelar</button>
              <button
                id="btn-confirmar-eliminar-emp"
                onClick={() => onEliminar(confirmDelete)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
