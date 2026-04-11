'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signUpWithEmail, signInWithGoogle } from '@/lib/auth';

const PLANES = {
  starter: { nombre: 'Starter', precio: '$50.000 COP / 100 baterías', color: '#64748b' },
  pro: { nombre: 'Pro', precio: '$150.000 COP / mes ilimitado', color: '#0ea5e9' },
  free: { nombre: 'Prueba gratuita', precio: '3 baterías gratis', color: '#059669' },
};

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = (searchParams.get('plan') as keyof typeof PLANES) || 'free';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    email: '',
    password: '',
    nombre: '',
    tarjetaProfesional: '',
    especializacion: '',
    plan: planParam,
  });

  const updateForm = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleGoogleRegister = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      router.push('/dashboard/onboarding');
    } catch {
      setError('Error al registrarse con Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }
    setLoading(true);
    setError('');
    try {
      await signUpWithEmail(form.email, form.password, {
        nombre: form.nombre,
        tarjetaProfesional: form.tarjetaProfesional,
        especializacion: form.especializacion,
      });
      router.push('/dashboard');
    } catch {
      setError('No se pudo crear la cuenta. Verifica que el correo no esté registrado.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const plan = PLANES[form.plan] || PLANES.free;

  return (
    <div className="min-h-screen mesh-gradient" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
      <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: '460px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
            <img src="/logo-psicolab.png" alt="Psicolab" style={{ height: '44px', width: 'auto', borderRadius: '8px' }} />
          </Link>
        </div>

        {/* Plan badge */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span className="badge" style={{ background: `${plan.color}20`, color: plan.color, border: `1px solid ${plan.color}40`, fontSize: '0.75rem' }}>
            Plan {plan.nombre} · {plan.precio}
          </span>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              width: '32px', height: '4px', borderRadius: '2px',
              background: s <= step ? '#0ea5e9' : 'rgba(255,255,255,0.1)',
              transition: 'background 0.3s ease'
            }} />
          ))}
        </div>

        <div className="glass" style={{ borderRadius: '20px', padding: '2rem' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white', marginBottom: '0.35rem', textAlign: 'center' }}>
            {step === 1 ? 'Crear tu cuenta' : 'Tu perfil profesional'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.8rem', textAlign: 'center', marginBottom: '1.75rem' }}>
            {step === 1 ? 'Acceso y credenciales' : 'Datos de tu licencia profesional'}
          </p>

          {step === 1 && (
            <>
              <button onClick={handleGoogleRegister} disabled={loading} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '0.75rem', padding: '0.8rem', borderRadius: '12px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: 'white', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500',
                marginBottom: '1.25rem', fontFamily: 'var(--font-inter)'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Registrarse con Google
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                <span style={{ color: '#475569', fontSize: '0.8rem' }}>o con email</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="input-label">Correo electrónico</label>
                  <input type="email" value={form.email} onChange={e => updateForm('email', e.target.value)} className="input-field" placeholder="correo@ejemplo.com" required />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="input-label">Contraseña</label>
                  <input type="password" value={form.password} onChange={e => updateForm('password', e.target.value)} className="input-field" placeholder="Mínimo 8 caracteres" minLength={8} required />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="input-label">Nombre completo</label>
                  <input type="text" value={form.nombre} onChange={e => updateForm('nombre', e.target.value)} className="input-field" placeholder="Dra. Ana María López" required />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="input-label">N.° Tarjeta Profesional</label>
                  <input type="text" value={form.tarjetaProfesional} onChange={e => updateForm('tarjetaProfesional', e.target.value)} className="input-field" placeholder="ej. 12345-PSI" required />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="input-label">Especialización en SST</label>
                  <input type="text" value={form.especializacion} onChange={e => updateForm('especializacion', e.target.value)} className="input-field" placeholder="Especialista en SST / Salud Ocupacional" required />
                </div>
              </>
            )}

            {error && (
              <div style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.2)', borderRadius: '10px', padding: '0.75rem', marginBottom: '1rem', color: '#fb7185', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {loading ? <div className="spinner" /> : null}
              {loading ? 'Creando cuenta...' : step === 1 ? 'Continuar →' : 'Crear mi cuenta'}
            </button>

            {step === 2 && (
              <button type="button" onClick={() => setStep(1)} style={{ width: '100%', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', marginTop: '0.75rem', fontSize: '0.85rem', fontFamily: 'var(--font-inter)' }}>
                ← Volver
              </button>
            )}
          </form>

          <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem', marginTop: '1.25rem' }}>
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '500' }}>
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0a0f1e' }}><div className="spinner" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
