'use client';

import { useState, useEffect, Suspense } from 'react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import { useAuth } from '@/lib/auth';
import { CheckCircle2, Loader2, Zap, Package, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

// Inicializar SDK del cliente
const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || '';
if (MP_PUBLIC_KEY) {
  initMercadoPago(MP_PUBLIC_KEY, { locale: 'es-CO' });
}

function SuscripcionContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const pagoStatus = searchParams.get('pago');
  
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const comprarPlan = async (planId: 'starter' | 'pro') => {
    if (!user) return;
    setLoadingPlan(planId);
    setError('');
    setPreferenceId(null);
    
    try {
      const res = await fetch('/api/mercadopago/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planId,
          userId: user.uid,
          email: user.email,
          nombre: user.displayName || 'Usuario Psicolab'
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Error al generar link de pago');
      
      setPreferenceId(data.preferenceId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-white">Facturación y Planes</h1>
        <span className="badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          Pagos Seguros Automáticos
        </span>
      </div>

      <p className="text-slate-400 mb-8 max-w-2xl">
        Adquiere baterías adicionales para tus evaluaciones o pásate al Plan Pro para evaluar sin límites mensuales. 
        El pago está procesado de forma segura por MercadoPago y se habilita automáticamente.
      </p>

      {pagoStatus === 'pendiente' && (
         <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 text-amber-200">
           <AlertCircle size={20} />
           <p>Tu pago está pendiente de aprobación. Se reflejará automáticamente cuando MercadoPago lo valide.</p>
         </div>
      )}
      {pagoStatus === 'fallido' && (
         <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-200">
           <AlertCircle size={20} />
           <p>El pago fue rechazado o se canceló. Por favor intenta con otro método de pago.</p>
         </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-200">
           <AlertCircle size={20} />
           <p>{error}</p>
         </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        
        {/* PLAN STARTER */}
        <div className="glass-card p-8 flex flex-col relative overflow-hidden transition-all hover:border-slate-500/30">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 mb-6 border border-slate-700">
            <Package size={24} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Plan Starter</h2>
          <div className="text-3xl font-black text-white mb-6">
            $50.000 <span className="text-sm text-slate-400 font-normal">COP</span>
          </div>
          
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex gap-3 text-slate-300">
              <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
              <span>Paquete de <strong>100 baterías</strong></span>
            </li>
            <li className="flex gap-3 text-slate-300">
              <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
              <span>Válidas sin caducidad mensual</span>
            </li>
            <li className="flex gap-3 text-slate-300">
              <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
              <span>Calificación inmediata y PDF</span>
            </li>
          </ul>

          <button 
            onClick={() => comprarPlan('starter')}
            disabled={loadingPlan !== null}
            className="w-full py-3 rounded-xl font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all flex items-center justify-center gap-2"
          >
            {loadingPlan === 'starter' ? <Loader2 size={18} className="animate-spin" /> : null}
            Comprar ahora
          </button>
        </div>

        {/* PLAN PRO */}
        <div className="glass-card p-8 flex flex-col relative overflow-hidden transition-all border-sky-500/30 hover:shadow-lg hover:shadow-sky-500/10">
          <div className="absolute top-0 right-0 bg-sky-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl z-10">
            MÁS POPULAR
          </div>
          {/* Fondo gradiente sutil */}
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-purple-500/5 pointer-events-none" />

          <div className="w-12 h-12 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400 mb-6 border border-sky-500/30">
            <Zap size={24} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Plan Pro</h2>
          <div className="text-3xl font-black text-white mb-6">
            $150.000 <span className="text-sm text-slate-400 font-normal">COP / mes</span>
          </div>
          
          <ul className="space-y-4 mb-8 flex-1 relative z-10">
            <li className="flex gap-3 text-slate-300">
              <CheckCircle2 className="text-sky-400 shrink-0" size={20} />
              <span>Baterías <strong>ilimitadas</strong> aplicables</span>
            </li>
            <li className="flex gap-3 text-slate-300">
              <CheckCircle2 className="text-sky-400 shrink-0" size={20} />
              <span>Empresas ilimitadas</span>
            </li>
            <li className="flex gap-3 text-slate-300">
              <CheckCircle2 className="text-sky-400 shrink-0" size={20} />
              <span>Soporte prioritario y descargas en lote</span>
            </li>
          </ul>

          <button 
            onClick={() => comprarPlan('pro')}
            disabled={loadingPlan !== null}
            className="w-full py-3 rounded-xl font-semibold bg-sky-600 hover:bg-sky-500 text-white transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 relative z-10"
          >
            {loadingPlan === 'pro' ? <Loader2 size={18} className="animate-spin" /> : null}
            Suscribirse al Pro
          </button>
        </div>

      </div>

      {/* Widget de MercadoPago Checkout */}
      {preferenceId && (
        <div className="mt-12 max-w-xl mx-auto glass-card p-6 border-sky-500/30 shadow-2xl animate-fade-in-up">
           <h3 className="text-lg font-bold text-white mb-4 text-center">Completa tu pago seguro</h3>
           <Wallet 
             initialization={{ preferenceId }} 
           />
        </div>
      )}
    </div>
  );
}

export const dynamic = 'force-dynamic';

export default function SuscripcionPage() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><Loader2 className="animate-spin text-sky-500" size={32} /></div>}>
      <SuscripcionContent />
    </Suspense>
  )
}
