'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2, Users, ClipboardList, TrendingUp, AlertTriangle,
  CheckCircle2, Plus, ArrowRight, Loader2, Activity
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Stats {
  empresas: number;
  empleados: number;
  completados: number;
  enProceso: number;
  pendientes: number;
  riesgoAlto: number;
}

interface EmpresaResumen {
  id: string;
  nombre: string;
  sector: string;
  creadoEn?: any;
  total: number;
  completados: number;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats]     = useState<Stats | null>(null);
  const [empresas, setEmpresas] = useState<EmpresaResumen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Empresas
        const empSnap = await getDocs(
          query(collection(db, 'empresas'), where('psicologo', '==', user.uid))
        );
        const empresasData = empSnap.docs.map(d => ({ id: d.id, ...d.data() })) as (EmpresaResumen & { sector: string })[];

        // Empleados con estados
        const empleSnap = await getDocs(
          query(collection(db, 'empleados'), where('psicologo', '==', user.uid))
        );
        const empleados = empleSnap.docs.map(d => d.data());
        const completados = empleados.filter(e => e.estadoBateria === 'completado').length;
        const enProceso  = empleados.filter(e => e.estadoBateria === 'en_proceso').length;
        const pendientes = empleados.filter(e => e.estadoBateria === 'pendiente').length;

        // Resultados con riesgo alto/muy_alto
        const resSnap = await getDocs(
          query(collection(db, 'resultados'), where('psicologo', '==', user.uid))
        );
        const riesgoAlto = resSnap.docs.filter(d => {
          const cal = d.data().calificacion;
          const nivel = cal?.intra?.nivelRiesgoTotal;
          return nivel === 'alto' || nivel === 'muy_alto';
        }).length;

        // Resumen por empresa
        const resumenEmpresas: EmpresaResumen[] = empresasData.slice(0, 5).map(emp => {
          const emplEmp = empleados.filter((e: Record<string,unknown>) => e.empresaId === emp.id);
          return {
            id: emp.id,
            nombre: emp.nombre,
            sector: emp.sector,
            creadoEn: (emp as any).creadoEn,
            total: emplEmp.length,
            completados: emplEmp.filter((e: Record<string,unknown>) => e.estadoBateria === 'completado').length,
          };
        });

        setStats({
          empresas: empSnap.size,
          empleados: empleados.length,
          completados,
          enProceso,
          pendientes,
          riesgoAlto,
        });
        setEmpresas(resumenEmpresas);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-96">
      <Loader2 className="animate-spin text-sky-400" size={32} />
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Saludo */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Bienvenida, {user?.displayName?.split(' ')[0] ?? 'Psicóloga'} 👋
        </h1>
        <p className="text-slate-400 mt-1">
          Resumen de tu consultorio — PsicoCeleste
        </p>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-12">
        {[
          {
            label: 'Total Empresas', val: stats?.empresas ?? 0,
            icon: <Building2 size={24} className="text-sky-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]" />, color: 'text-white', bg: 'bg-gradient-to-br from-sky-500/10 to-sky-900/10 border-sky-500/20',
            href: '/dashboard/empresas'
          },
          {
            label: 'Empleados', val: stats?.empleados ?? 0,
            icon: <Users size={24} className="text-violet-400 drop-shadow-[0_0_10px_rgba(167,139,250,0.5)]" />, color: 'text-white', bg: 'bg-gradient-to-br from-violet-500/10 to-violet-900/10 border-violet-500/20',
            href: '/dashboard/empresas'
          },
          {
            label: 'Baterías Completas', val: stats?.completados ?? 0,
            icon: <CheckCircle2 size={24} className="text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" />, color: 'text-emerald-400', bg: 'bg-gradient-to-br from-emerald-500/10 to-emerald-900/10 border-emerald-500/20',
            href: '/dashboard/resultados'
          },
          {
            label: 'Riesgo Clínico Alto', val: stats?.riesgoAlto ?? 0,
            icon: <AlertTriangle size={24} className="text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]" />, color: 'text-red-400', bg: 'bg-gradient-to-br from-red-500/10 to-red-900/10 border-red-500/20',
            href: '/dashboard/resultados'
          },
          {
            label: 'Pendientes', val: stats?.pendientes ?? 0,
            icon: <ClipboardList size={24} className="text-slate-400" />, color: 'text-white', bg: 'bg-slate-800/40 border-white/5',
            href: '/dashboard/empresas'
          },
          {
            label: 'En Proceso AI', val: stats?.enProceso ?? 0,
            icon: <Activity size={24} className="text-amber-400" />, color: 'text-white', bg: 'bg-slate-800/40 border-amber-500/10',
            href: '/dashboard/empresas'
          },
        ].map(s => (
          <Link
            key={s.label}
            href={s.href}
            className={`glass-card p-6 flex flex-col justify-between h-full rounded-3xl ${s.bg} border hover:-translate-y-1 transition-all shadow-[0_0_30px_rgba(0,0,0,0.2)] hover:shadow-xl`}
          >
            <div className="mb-4">{s.icon}</div>
            <div>
              {loading
                ? <div className="h-8 w-12 bg-white/10 rounded-lg animate-pulse mb-2" />
                : <div className={`text-3xl font-black mb-1 ${s.color}`}>{s.val}</div>
              }
              <div className="text-sm font-medium text-slate-400">{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Cuerpo: Empresas */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Building2 size={18} className="text-sky-400" /> Empresas activas
          </h2>
          <Link href="/dashboard/empresas" className="text-xs text-sky-400 hover:underline flex items-center gap-1">
            Ver todas <ArrowRight size={13} />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="glass-card p-6 animate-pulse flex gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-white/10 rounded w-1/3" />
                  <div className="h-3 bg-white/5 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : empresas.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Building2 className="mx-auto text-slate-600 mb-4" size={48} />
            <p className="text-slate-300 text-lg font-medium mb-4">Aún no tienes empresas registradas</p>
            <Link href="/dashboard/empresas" className="btn-primary text-sm inline-flex items-center gap-2">
              <Plus size={16} /> Agregar primera empresa
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {empresas.map(emp => {
              const fetchDate = emp.creadoEn?.toDate ? emp.creadoEn.toDate().toLocaleDateString() : 'Procesado';
              
              return (
                <div
                  key={emp.id}
                  className="glass-card p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-sky-500/40 hover:bg-slate-800/40 transition-all border border-transparent shadow-lg bg-slate-800/20 group"
                >
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-sky-500/10 flex items-center justify-center shrink-0 border border-sky-500/20 shadow-inner group-hover:scale-110 transition-transform shadow-sky-500/10">
                      <Building2 className="text-sky-400" size={28} />
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <Link href={`/dashboard/empresas/${emp.id}`} className="hover:text-sky-400 transition-colors w-fit">
                        <h3 className="text-white font-black text-xl truncate mb-1">{emp.nombre}</h3>
                      </Link>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-400 font-medium tracking-wide">
                        <span className="flex items-center gap-2 bg-slate-900/50 px-3 py-1 rounded-lg border border-white/5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span> 
                          {emp.completados} Evaluaciones
                        </span>
                        <span className="flex items-center gap-2">
                          Último Movimiento: <span className="text-slate-300">{fetchDate}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t border-white/5 md:border-none">
                    <Link 
                      href={`/dashboard/empresas/${emp.id}`} 
                      className="flex-1 md:flex-none text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 font-bold text-sm flex items-center justify-center gap-2 py-3 px-6 rounded-xl transition-all"
                    >
                      <Users size={16} /> Administrar
                    </Link>
                    <Link 
                      href={`/dashboard/resultados?empresaId=${emp.id}`} 
                      className="flex-1 md:flex-none text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 font-bold text-sm flex items-center justify-center gap-2 py-3 px-6 rounded-xl shadow-lg shadow-sky-500/20 transition-all border border-t-white/20"
                    >
                      <TrendingUp size={16} /> Ver Reportes
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
