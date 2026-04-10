'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, Search, Building2, ClipboardList, TrendingUp, AlertCircle, Loader2,
  Hash, ChevronRight, CheckCircle2, UserCheck, FileText, ArrowRight, ArrowUpRight
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

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
}

interface Empresa {
  id: string;
  nombre: string;
}

const ESTADO_LABELS: Record<EstadoBateria, { label: string; color: string }> = {
  pendiente:   { label: 'Pendiente',   color: 'bg-slate-500/20 text-slate-300' },
  en_proceso:  { label: 'En proceso',  color: 'bg-amber-500/20 text-amber-300' },
  completado:  { label: 'Completado',  color: 'bg-emerald-500/20 text-emerald-300' },
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function EmpleadosDirectorioPage() {
  const { user } = useAuth();

  const [empleados, setEmpleados]   = useState<Empleado[]>([]);
  const [empresas, setEmpresas]     = useState<Record<string, string>>({});
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoBateria | 'todos'>('todos');
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>('todas');
  const [error, setError]           = useState('');

  // ── Cargar todo ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const cargarTodo = async () => {
      setLoading(true);
      try {
        // Cargar empresas para el mapa
        const qEmp = query(collection(db, 'empresas'), where('psicologo', '==', user.uid));
        const snapEmp = await getDocs(qEmp);
        const mapEmp: Record<string, string> = {};
        snapEmp.docs.forEach(d => { mapEmp[d.id] = d.data().nombre; });
        setEmpresas(mapEmp);

        // Cargar empleados globales
        const qEmpld = query(collection(db, 'empleados'), where('psicologo', '==', user.uid));
        const snapEmpld = await getDocs(qEmpld);
        const datos = snapEmpld.docs.map(d => ({ id: d.id, ...d.data() } as Empleado));
        setEmpleados(datos.sort((a, b) => a.nombre.localeCompare(b.nombre)));
      } catch {
        setError('Error al cargar el directorio de empleados.');
      } finally {
        setLoading(false);
      }
    };
    cargarTodo();
  }, [user]);

  // ── Filtrado ──────────────────────────────────────────────────────────────────
  const filtrados = empleados.filter(e => {
    const matchSearch =
      e.nombre.toLowerCase().includes(search.toLowerCase()) ||
      e.cedula.includes(search) ||
      e.cargo.toLowerCase().includes(search.toLowerCase());
    const matchEstado = filtroEstado === 'todos' || e.estadoBateria === filtroEstado;
    const matchEmpresa = filtroEmpresa === 'todas' || e.empresaId === filtroEmpresa;
    return matchSearch && matchEstado && matchEmpresa;
  });

  const stats = {
    total: empleados.length,
    pendiente: empleados.filter(e => e.estadoBateria === 'pendiente').length,
    en_proceso: empleados.filter(e => e.estadoBateria === 'en_proceso').length,
    completado: empleados.filter(e => e.estadoBateria === 'completado').length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="text-violet-400" size={28} />
            Directorio de Personal
          </h1>
          <p className="text-slate-400 mt-1">
            Gestión global de empleados de todas tus empresas
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <Link href="/dashboard/empresas" className="btn-primary flex items-center gap-2">
            Ver Empresas para agregar <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Registrados', val: stats.total,       color: 'text-violet-400',  icon: <Users size={16}/> },
          { label: 'Pendiente',         val: stats.pendiente,   color: 'text-slate-300',   icon: <ClipboardList size={16}/> },
          { label: 'En proceso',        val: stats.en_proceso,  color: 'text-amber-400',   icon: <FileText size={16}/> },
          { label: 'Completado',        val: stats.completado,  color: 'text-emerald-400', icon: <UserCheck size={16}/> },
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
      <div className="glass-card p-4 mb-6 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula o cargo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9 w-full"
          />
        </div>
        
        <div className="w-full md:w-64">
           <select 
              value={filtroEmpresa} 
              onChange={e => setFiltroEmpresa(e.target.value)}
              className="input-field w-full cursor-pointer"
           >
             <option value="todas" className="bg-slate-800 text-white">Todas las empresas</option>
             {Object.entries(empresas).map(([id, nombre]) => (
               <option key={id} value={id} className="bg-slate-800 text-white">{nombre}</option>
             ))}
           </select>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          {(['todos', 'pendiente', 'en_proceso', 'completado'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltroEstado(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filtroEstado === f
                  ? 'bg-violet-500 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              {f === 'todos' ? 'Todos Estados' : ESTADO_LABELS[f].label}
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

      {/* Tabla Global */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-violet-400" size={36} />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Users className="mx-auto text-slate-600 mb-4" size={48} />
          <p className="text-slate-300 text-lg font-medium">
            {search || filtroEstado !== 'todos' || filtroEmpresa !== 'todas' 
               ? 'Sin resultados para estos filtros.' 
               : 'Aún no hay personal registrado en tus empresas.'}
          </p>
          {!search && filtroEstado === 'todos' && filtroEmpresa === 'todas' && (
            <div className="mt-6 flex justify-center">
               <Link href="/dashboard/empresas" className="btn-primary inline-flex items-center gap-2">
                 Ir a crear tu primera Empresa
               </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Empleado</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium hidden md:table-cell">Empresa</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium hidden lg:table-cell">Cargo / Área</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Estado</th>
                  <th className="text-right px-4 py-3 text-xs text-slate-400 font-medium">Panel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtrados.map(emp => {
                  const estado = ESTADO_LABELS[emp.estadoBateria] ?? ESTADO_LABELS.pendiente;
                  const empresaNombre = empresas[emp.empresaId] || 'Empresa Desconocida';
                  return (
                    <tr key={emp.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0 text-violet-400 text-xs font-bold">
                            {emp.nombre.charAt(0)}
                          </div>
                          <div>
                            <div className="text-white font-medium text-sm">{emp.nombre}</div>
                            <div className="text-slate-500 text-xs flex items-center gap-1">
                               <Hash size={10} /> {emp.cedula}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Link href={`/dashboard/empresas/${emp.empresaId}`} className="text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 text-xs">
                          <Building2 size={12}/> {empresaNombre}
                        </Link>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="text-white text-xs">{emp.cargo}</div>
                        <div className="text-slate-500 text-xs">{emp.area}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-lg ${estado.color}`}>
                          {estado.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link 
                           href={`/dashboard/empresas/${emp.empresaId}`}
                           className="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-slate-500/20 text-slate-400 hover:text-white transition-colors"
                           title="Ver en empresa"
                        >
                           <ArrowUpRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
