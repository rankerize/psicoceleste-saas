'use client';

import { useState, useEffect } from 'react';
import {
  Building2, Plus, Search, Edit2, Trash2, Users, ChevronRight,
  MapPin, Phone, Mail, Hash, Globe, X, Check, AlertCircle, Loader2
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import {
  collection, addDoc, updateDoc, deleteDoc, doc, query,
  where, getDocs, serverTimestamp, Timestamp
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
  const [showModal, setShowModal]   = useState(false);
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
      const datos = snap.docs.map(d => ({ id: d.id, ...d.data() } as Empresa));
      setEmpresas(datos.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    } catch {
      setError('Error al cargar empresas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarEmpresas(); }, [user]);

  // ── Guardar (crear o editar) ──────────────────────────────────────────────────
  const onGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.nombre || !form.nit) { setError('Nombre y NIT son obligatorios'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, psicologo: user.uid };
      if (editando) {
        await updateDoc(doc(db, 'empresas', editando.id), payload);
      } else {
        await addDoc(collection(db, 'empresas'), {
          ...payload,
          totalBaterias: 0,
          creadoEn: serverTimestamp(),
        });
      }
      setShowModal(false);
      setEditando(null);
      setForm(EMPTY_FORM);
      await cargarEmpresas();
    } catch {
      setError('Error al guardar. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
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

  // ── Abrir modal edición ───────────────────────────────────────────────────────
  const abrirEdicion = (emp: Empresa) => {
    setEditando(emp);
    setForm({
      nombre: emp.nombre, nit: emp.nit, sector: emp.sector,
      ciudad: emp.ciudad, departamento: emp.departamento,
      telefono: emp.telefono, email: emp.email,
      cantidadEmpleados: emp.cantidadEmpleados, contactoNombre: emp.contactoNombre,
    });
    setShowModal(true);
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
          onClick={() => { setForm(EMPTY_FORM); setEditando(null); setShowModal(true); }}
          className="btn-primary flex items-center gap-2 self-start"
        >
          <Plus size={18} />
          Nueva Empresa
        </button>
      </div>

      {/* Búsqueda */}
      <div className="glass-card p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            id="search-empresas"
            type="text"
            placeholder="Buscar por nombre, NIT o ciudad..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl mb-6">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

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
            <button
              onClick={() => { setForm(EMPTY_FORM); setEditando(null); setShowModal(true); }}
              className="btn-primary"
            >
              <Plus size={16} className="inline mr-2" /> Registrar primera empresa
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtradas.map(emp => (
            <div
              key={emp.id}
              id={`card-empresa-${emp.id}`}
              className="glass-card p-5 hover:border-sky-500/40 transition-all group"
            >
              {/* Encabezado */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center shrink-0">
                    <Building2 className="text-sky-400" size={20} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-white text-sm leading-tight">{emp.nombre}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">NIT: {emp.nit}</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-lg bg-sky-500/10 text-sky-300 whitespace-nowrap">
                  {SECTORES.find(s => s.value === emp.sector)?.label ?? emp.sector}
                </span>
              </div>

              {/* Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <MapPin size={13} />
                  {emp.ciudad}, {emp.departamento}
                </div>
                {emp.email && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Mail size={13} />
                    {emp.email}
                  </div>
                )}
                {emp.telefono && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Phone size={13} />
                    {emp.telefono}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between border-t border-white/5 pt-3">
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Users size={13} className="text-sky-400" />
                    {emp.cantidadEmpleados} empleados
                  </span>
                  <span className="flex items-center gap-1">
                    <Hash size={13} className="text-emerald-400" />
                    {emp.totalBaterias ?? 0} baterías
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    id={`btn-editar-${emp.id}`}
                    onClick={() => abrirEdicion(emp)}
                    className="p-1.5 rounded-lg hover:bg-sky-500/20 text-sky-400 transition-colors"
                    title="Editar empresa"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    id={`btn-eliminar-${emp.id}`}
                    onClick={() => setConfirmDelete(emp.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                    title="Eliminar empresa"
                  >
                    <Trash2 size={14} />
                  </button>
                  <a
                    href={`/dashboard/empresas/${emp.id}`}
                    className="p-1.5 rounded-lg hover:bg-slate-500/20 text-slate-300 transition-colors"
                    title="Ver empleados"
                  >
                    <ChevronRight size={14} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal Nueva / Editar ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative z-10 glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="text-sky-400" size={20} />
                {editando ? 'Editar Empresa' : 'Nueva Empresa Cliente'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={onGuardar} className="space-y-4">
              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-300 px-3 py-2 rounded-lg text-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nombre */}
                <div className="sm:col-span-2">
                  <label className="block text-sm text-slate-300 mb-1">Nombre de la empresa *</label>
                  <input
                    id="input-nombre-empresa"
                    type="text"
                    required
                    value={form.nombre}
                    onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                    className="input-field w-full"
                    placeholder="Ej: Construcciones ABC S.A.S."
                  />
                </div>

                {/* NIT */}
                <div>
                  <label className="block text-sm text-slate-300 mb-1">NIT *</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input
                      id="input-nit"
                      type="text"
                      required
                      value={form.nit}
                      onChange={e => setForm(f => ({ ...f, nit: e.target.value }))}
                      className="input-field w-full pl-9"
                      placeholder="900.123.456-7"
                    />
                  </div>
                </div>

                {/* Sector */}
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Sector económico</label>
                  <select
                    id="select-sector"
                    value={form.sector}
                    onChange={e => setForm(f => ({ ...f, sector: e.target.value as Sector }))}
                    className="input-field w-full"
                  >
                    {SECTORES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Ciudad */}
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Ciudad</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input
                      id="input-ciudad"
                      type="text"
                      value={form.ciudad}
                      onChange={e => setForm(f => ({ ...f, ciudad: e.target.value }))}
                      className="input-field w-full pl-9"
                      placeholder="Bogotá"
                    />
                  </div>
                </div>

                {/* Departamento */}
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Departamento</label>
                  <select
                    id="select-departamento"
                    value={form.departamento}
                    onChange={e => setForm(f => ({ ...f, departamento: e.target.value }))}
                    className="input-field w-full"
                  >
                    {DEPARTAMENTOS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input
                      id="input-telefono"
                      type="tel"
                      value={form.telefono}
                      onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                      className="input-field w-full pl-9"
                      placeholder="+57 300 123 4567"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Email de contacto</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input
                      id="input-email-empresa"
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="input-field w-full pl-9"
                      placeholder="rrhh@empresa.com"
                    />
                  </div>
                </div>

                {/* N° empleados */}
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Número de empleados</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input
                      id="input-empleados"
                      type="number"
                      min={1}
                      value={form.cantidadEmpleados || ''}
                      onChange={e => setForm(f => ({ ...f, cantidadEmpleados: parseInt(e.target.value) || 0 }))}
                      className="input-field w-full pl-9"
                      placeholder="50"
                    />
                  </div>
                </div>

                {/* Contacto */}
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Nombre del contacto</label>
                  <input
                    id="input-contacto"
                    type="text"
                    value={form.contactoNombre}
                    onChange={e => setForm(f => ({ ...f, contactoNombre: e.target.value }))}
                    className="input-field w-full"
                    placeholder="Ej: María López (RRHH)"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  id="btn-guardar-empresa"
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <><Loader2 size={16} className="animate-spin" /> Guardando...</>
                  ) : (
                    <><Check size={16} /> {editando ? 'Actualizar' : 'Registrar Empresa'}</>
                  )}
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
            <h3 className="text-white font-bold text-lg mb-2">¿Eliminar empresa?</h3>
            <p className="text-slate-400 text-sm mb-6">
              Esta acción es <span className="text-red-400 font-semibold">permanente</span> y eliminará todos los datos asociados a esta empresa.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                id="btn-confirmar-eliminar"
                onClick={() => onEliminar(confirmDelete)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-colors"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
