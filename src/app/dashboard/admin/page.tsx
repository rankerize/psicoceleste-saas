'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import {
  Users, Crown, Key, Loader2, Calendar, LayoutDashboard,
  Search, Mail, Building2, TrendingUp, ShieldAlert, CheckCircle2
} from 'lucide-react';

interface Psicologo {
  id: string;
  email: string;
  nombre: string;
  plan: string;
  baterias_usadas: number;
  createdAt?: any;
  tarjetaProfesional?: string;
}

interface AdminState {
  totalPsicologos: number;
  totalPro: number;
  totalBateriasGlobales: number;
  ingresosEstimados: number;
}

export default function SuperAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [psicologos, setPsicologos] = useState<Psicologo[]>([]);
  const [stats, setStats] = useState<AdminState>({
    totalPsicologos: 0,
    totalPro: 0,
    totalBateriasGlobales: 0,
    ingresosEstimados: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  // Validación de Dominio y Carga
  useEffect(() => {
    if (authLoading) return;
    
    if (!user?.email?.endsWith('@rankerize.com')) {
      router.push('/dashboard');
      return;
    }

    async function loadGlobalData() {
      setLoading(true);
      try {
        const usersSnap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
        const usersData = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Psicologo));
        
        let tPro = 0;
        let tBat = 0;
        
        usersData.forEach(u => {
           if (u.plan === 'pro') tPro++;
           tBat += (u.baterias_usadas || 0);
        });

        setStats({
          totalPsicologos: usersData.length,
          totalPro: tPro,
          totalBateriasGlobales: tBat,
          ingresosEstimados: tPro * 150000,
        });

        setPsicologos(usersData);
      } catch (err) {
        console.error('Lector global de usuarios falló: ', err);
      } finally {
        setLoading(false);
      }
    }

    loadGlobalData();
  }, [user, authLoading, router]);

  const handleResetPassword = async (email: string) => {
    if (!window.confirm(`¿Enviar enlace de reseteo de contraseña a ${email}?`)) return;
    try {
      await sendPasswordResetEmail(auth, email);
      setActionMsg(`Correo de recuperación enviado a ${email}`);
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err: any) {
      alert('Error enviando reseteo: ' + err.message);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p>Validando credenciales administrativas...</p>
      </div>
    );
  }

  // Si pasa acá es Admin Rankerize
  const filteredUsers = psicologos.filter(p => 
    p.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up pb-20">
      {/* HEADER DE PROTECCIÓN (ADMIN) */}
      <div className="bg-gradient-to-r from-violet-50 to-white border border-violet-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-900">
            <Crown className="text-violet-600" /> Panel Super Administrador
          </h1>
          <p className="text-slate-600 text-sm mt-1">Gestión Global exclusiva para equipo Rankerize.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-full shadow-md">
          <ShieldAlert size={14} /> Acceso Nivel 5 Activado
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2">
          <CheckCircle2 size={18} /> {actionMsg}
        </div>
      )}

      {/* KPI ADMIN CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-xl border border-slate-200 flex flex-col">
          <span className="text-slate-500 text-sm flex items-center gap-1 mb-2"><Users size={14}/> Psicólogos Registrados</span>
          <span className="text-3xl font-bold text-slate-900">{stats.totalPsicologos}</span>
          <span className="text-xs text-sky-600 mt-1 font-medium">+ Nuevos este mes</span>
        </div>
        
        <div className="glass-card p-5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col">
          <span className="text-emerald-700 text-sm flex items-center gap-1 mb-2"><TrendingUp size={14}/> Licencias PRO (Vigentes)</span>
          <span className="text-3xl font-bold text-emerald-600">{stats.totalPro}</span>
          <span className="text-xs text-emerald-600 mt-1">Renovación mensual activa</span>
        </div>

        <div className="glass-card p-5 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col">
          <span className="text-amber-700 text-sm flex items-center gap-1 mb-2"><LayoutDashboard size={14}/> MRR Estimado (COP)</span>
          <span className="text-3xl font-bold text-amber-600">${stats.ingresosEstimados.toLocaleString('es-CO')}</span>
          <span className="text-xs text-amber-600 mt-1">Suscripciones PRO activas base</span>
        </div>

        <div className="glass-card p-5 rounded-xl border border-indigo-200 bg-indigo-50/50 flex flex-col">
          <span className="text-indigo-700 text-sm flex items-center gap-1 mb-2"><Building2 size={14}/> Baterías Consumidas</span>
          <span className="text-3xl font-black text-indigo-600">{stats.totalBateriasGlobales}</span>
          <span className="text-xs text-indigo-600 mt-1">Uso de infraestructura</span>
        </div>
      </div>

      {/* SEARCH Y TABLA DE USUARIOS */}
      <div className="glass-card rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50">
           <h3 className="text-slate-900 font-bold flex items-center gap-2">
              <Users size={18} className="text-slate-500" /> Directorio Global de Licencias
           </h3>
           <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Buscar psicólogo (correo o nombre)..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg pl-9 py-2 focus:ring-2 focus:ring-violet-500 outline-none"
              />
           </div>
        </div>
        
        <div className="overflow-x-auto w-full">
           <table className="w-full text-sm text-left">
               <thead className="bg-white text-xs text-slate-500 uppercase border-b border-slate-200">
                   <tr>
                       <th className="py-4 px-5">Información Usuario</th>
                       <th className="py-4 px-5">Plan Actual</th>
                       <th className="py-4 px-5">Baterías Usadas</th>
                       <th className="py-4 px-5">Fecha Alta</th>
                       <th className="py-4 px-5 text-center">Acciones y Ayuda</th>
                   </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 bg-white/50">
                   {filteredUsers.length === 0 ? (
                       <tr><td colSpan={5} className="py-8 text-center text-slate-500">No se encontraron psicólogos registrados...</td></tr>
                   ) : (
                       filteredUsers.map(psi => {
                           const isPro = psi.plan === 'pro';
                           const dateObj = psi.createdAt?.toDate ? psi.createdAt.toDate() : null;
                           const fetchDate = dateObj ? dateObj.toLocaleDateString('es-CO') : 'Recientemente';
                           
                           return (
                               <tr key={psi.id} className="hover:bg-slate-50 transition-colors">
                                   <td className="py-4 px-5">
                                      <div className="font-bold text-slate-900 mb-0.5">{psi.nombre || 'Sin Nombre Legal'}</div>
                                      <div className="flex items-center gap-1 text-xs text-slate-500">
                                          <Mail size={12} className="text-slate-400" /> {psi.email}
                                      </div>
                                   </td>
                                   <td className="py-4 px-5 whitespace-nowrap">
                                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${isPro ? 'text-emerald-700 bg-emerald-100 border-emerald-200' : 'text-slate-600 bg-slate-100 border-slate-200'}`}>
                                          {isPro ? 'PRO (Ilimitado)' : 'FREE / STARTER'}
                                      </span>
                                   </td>
                                   <td className="py-4 px-5 text-slate-700 font-medium">
                                      {psi.baterias_usadas || 0} consumidas
                                   </td>
                                   <td className="py-4 px-5 text-slate-600 text-xs">
                                      <span className="flex items-center gap-1"><Calendar size={12}/> {fetchDate}</span>
                                   </td>
                                   <td className="py-4 px-5 text-center">
                                      <button 
                                        onClick={() => handleResetPassword(psi.email)}
                                        className="inline-flex items-center justify-center p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors border border-red-100"
                                        title="Enviar correo de recuperación de contraseña"
                                      >
                                          <Key size={16} /> <span className="ml-2 text-xs font-bold hidden sm:inline">Reset PW</span>
                                      </button>
                                   </td>
                               </tr>
                           );
                       })
                   )}
               </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}
