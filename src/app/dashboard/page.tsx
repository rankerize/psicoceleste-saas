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
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-8">
        {[
          {
            label: 'Empresas', val: stats?.empresas ?? 0,
            icon: <Building2 size={20} />, color: 'text-sky-400', bg: 'from-sky-500/10',
            href: '/dashboard/empresas'
          },
          {
            label: 'Empleados', val: stats?.empleados ?? 0,
            icon: <Users size={20} />, color: 'text-violet-400', bg: 'from-violet-500/10',
            href: '/dashboard/empresas'
          },
          {
            label: 'Pendientes', val: stats?.pendientes ?? 0,
            icon: <ClipboardList size={20} />, color: 'text-slate-300', bg: 'from-slate-500/10',
            href: '/dashboard/empresas'
          },
          {
            label: 'En proceso', val: stats?.enProceso ?? 0,
            icon: <Activity size={20} />, color: 'text-amber-400', bg: 'from-amber-500/10',
            href: '/dashboard/empresas'
          },
          {
            label: 'Completados', val: stats?.completados ?? 0,
            icon: <CheckCircle2 size={20} />, color: 'text-emerald-400', bg: 'from-emerald-500/10',
            href: '/dashboard/resultados'
          },
          {
            label: 'Riesgo alto', val: stats?.riesgoAlto ?? 0,
            icon: <AlertTriangle size={20} />, color: 'text-red-400', bg: 'from-red-500/10',
            href: '/dashboard/resultados'
          },
        ].map(s => (
          <Link
            key={s.label}
            href={s.href}
            className={`glass-card p-4 bg-gradient-to-br ${s.bg} to-transparent hover:scale-105 transition-transform`}
          >
            <div className={`${s.color} mb-2`}>{s.icon}</div>
            {loading
              ? <div className="h-7 w-10 bg-white/10 rounded animate-pulse mb-1" />
              : <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
            }
            <div className="text-xs text-slate-500">{s.label}</div>
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
          <div className="space-y-4">
            {empresas.map(emp => {
              const fetchDate = emp.creadoEn?.toDate ? emp.creadoEn.toDate().toLocaleDateString() : 'Recientemente';
              
              return (
                <div
                  key={emp.id}
                  className="glass-card p-5 flex flex-col md:flex-row md:items-center gap-4 hover:border-sky-500/30 transition-all border-l-4 border-transparent hover:border-l-sky-500"
                >
                  <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center shrink-0">
                    <Building2 className="text-sky-400" size={24} />
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-white font-bold text-base truncate mb-1">{emp.nombre}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded">
                        <CheckCircle2 size={12} className="text-emerald-400" /> 
                        {emp.completados} baterías aplicadas
                      </span>
                      <span className="flex items-center gap-1">
                        Última act.: <span className="text-slate-300">{fetchDate}</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t border-white/5 md:border-t-0">
                    <Link 
                      href={`/dashboard/empresas/${emp.id}`} 
                      className="flex-1 md:flex-none btn-secondary text-sm flex items-center justify-center gap-2 py-2 px-4 shadow-sm"
                    >
                      <Users size={14} /> Ver empleados
                    </Link>
                    <Link 
                      href="/dashboard/resultados" 
                      className="flex-1 md:flex-none btn-primary text-sm flex items-center justify-center gap-2 py-2 px-4 bg-gradient-to-r from-violet-600 to-sky-600 hover:from-violet-500 hover:to-sky-500 shadow-md shadow-sky-900/50 border-none"
                    >
                      <TrendingUp size={14} /> Ver resultados
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
