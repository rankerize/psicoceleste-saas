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

      {/* Cuerpo: Empresas + Acciones rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Empresas recientes */}
        <div className="lg:col-span-2">
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
                <div key={i} className="glass-card p-4 animate-pulse">
                  <div className="h-4 bg-white/10 rounded w-1/2 mb-2" />
                  <div className="h-2 bg-white/5 rounded w-full" />
                </div>
              ))}
            </div>
          ) : empresas.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Building2 className="mx-auto text-slate-600 mb-3" size={36} />
              <p className="text-slate-300 text-sm mb-3">Aún no tienes empresas registradas</p>
              <Link href="/dashboard/empresas" className="btn-primary text-sm inline-flex items-center gap-2">
                <Plus size={15} /> Agregar primera empresa
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {empresas.map(emp => {
                const pct = emp.total > 0 ? Math.round((emp.completados / emp.total) * 100) : 0;
                return (
                  <Link
                    key={emp.id}
                    href={`/dashboard/empresas/${emp.id}`}
                    className="glass-card p-4 flex items-center gap-4 hover:border-sky-500/30 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center shrink-0">
                      <Building2 className="text-sky-400" size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{emp.nombre}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 bg-white/5 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-sky-500 transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {emp.completados}/{emp.total} completados
                        </span>
                      </div>
                    </div>
                    <ArrowRight size={15} className="text-slate-600 group-hover:text-sky-400 transition-colors" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Acciones rápidas */}
        <div>
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-violet-400" /> Acciones rápidas
          </h2>
          <div className="space-y-3">
            {[
              {
                href: '/dashboard/empresas',
                icon: <Building2 size={18} />,
                title: 'Gestionar empresas',
                desc: 'Registrar o editar clientes',
                color: 'text-sky-400',
              },
              {
                href: '/dashboard/empresas',
                icon: <Users size={18} />,
                title: 'Gestionar empleados',
                desc: 'Agregar o importar CSV',
                color: 'text-violet-400',
              },
              {
                href: '/bateria',
                icon: <ClipboardList size={18} />,
                title: 'Iniciar batería',
                desc: 'Aplicación digital en pantalla',
                color: 'text-emerald-400',
              },
              {
                href: '/dashboard/resultados',
                icon: <TrendingUp size={18} />,
                title: 'Ver resultados',
                desc: 'Perfiles de riesgo calificados',
                color: 'text-amber-400',
              },
            ].map(a => (
              <Link
                key={a.href + a.title}
                href={a.href}
                className="glass-card p-4 flex items-center gap-3 hover:border-sky-500/30 transition-all group"
              >
                <div className={`${a.color} opacity-80 group-hover:opacity-100`}>{a.icon}</div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{a.title}</p>
                  <p className="text-slate-500 text-xs">{a.desc}</p>
                </div>
                <ArrowRight size={14} className="text-slate-600 group-hover:text-sky-400 transition-colors" />
              </Link>
            ))}
          </div>

          {/* Marco legal */}
          <div className="glass-card p-4 mt-4 border-sky-500/10">
            <p className="text-xs text-slate-500 leading-relaxed">
              🔒 <strong className="text-slate-400">Marco legal:</strong> Resolución 2646/2008 —
              Batería validada Ministerio Protección Social 2010 — Resolución 2404/2019
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
