'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmail, signInWithGoogle, resetPassword } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot password state
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmail(email, password);
      router.push('/dashboard');
    } catch {
      setError('Correo o contraseña incorrectos. Verifica tus datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setError(`Error Firebase: ${err.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    try {
      await resetPassword(resetEmail);
      setResetSuccess(true);
    } catch {
      setResetError('No encontramos ese correo. Verifica e intenta de nuevo.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-gradient" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(14,165,233,0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
            <img 
              src="/logo.jpg" 
              alt="PsicoLab Logo" 
              style={{ height: '48px', width: 'auto', borderRadius: '8px', boxShadow: '0 0 20px rgba(255,255,255,0.1)' }}
            />
          </Link>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Plataforma para psicólogos especializados en SST
          </p>
        </div>

        {/* Card */}
        <div className="glass" style={{ borderRadius: '20px', padding: '2rem' }}>

          {/* ── FORGOT PASSWORD PANEL ── */}
          {showReset ? (
            <div>
              <button
                onClick={() => { setShowReset(false); setResetSuccess(false); setResetError(''); }}
                style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '1rem', padding: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                ← Volver al inicio de sesión
              </button>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'white', marginBottom: '0.5rem' }}>
                ¿Olvidaste tu contraseña?
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Ingresa tu correo y te enviaremos un enlace para restablecerla.
              </p>

              {resetSuccess ? (
                <div style={{ background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)', borderRadius: '12px', padding: '1.25rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📧</div>
                  <p style={{ color: '#34d399', fontWeight: '600', marginBottom: '0.25rem' }}>¡Correo enviado!</p>
                  <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Revisa tu bandeja de entrada y sigue el enlace para restablecer tu contraseña.</p>
                </div>
              ) : (
                <form onSubmit={handleResetPassword}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label className="input-label">Correo electrónico</label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      className="input-field"
                      placeholder="psicologa@ejemplo.com"
                      required
                    />
                  </div>
                  {resetError && (
                    <div style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.2)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#fb7185', fontSize: '0.85rem' }}>
                      {resetError}
                    </div>
                  )}
                  <button type="submit" className="btn-primary" disabled={resetLoading} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    {resetLoading ? <div className="spinner" /> : null}
                    {resetLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                  </button>
                </form>
              )}
            </div>

          ) : (
            /* ── NORMAL LOGIN ── */
            <>
              <h1 style={{ fontSize: '1.3rem', fontWeight: '700', color: 'white', marginBottom: '1.75rem', textAlign: 'center' }}>
                Iniciar Sesión
              </h1>

              {/* Google */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '0.75rem', padding: '0.8rem', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  color: 'white', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500',
                  transition: 'all 0.2s ease', marginBottom: '1.25rem', fontFamily: 'var(--font-inter)'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar con Google
              </button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                <span style={{ color: '#475569', fontSize: '0.8rem' }}>o con email</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
              </div>

              {/* Email form */}
              <form onSubmit={handleEmailLogin}>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="input-label">Correo electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="psicologa@ejemplo.com"
                    required
                  />
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <label className="input-label">Contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input-field"
                    placeholder="••••••••"
                    required
                  />
                </div>

                {/* Forgot password link */}
                <div style={{ textAlign: 'right', marginBottom: '1.25rem' }}>
                  <button
                    type="button"
                    onClick={() => { setShowReset(true); setResetEmail(email); }}
                    style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '0.82rem', padding: 0, fontFamily: 'var(--font-inter)' }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                {error && (
                  <div style={{
                    background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.2)',
                    borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem',
                    color: '#fb7185', fontSize: '0.85rem'
                  }}>{error}</div>
                )}

                <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  {loading ? <div className="spinner" /> : null}
                  {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                </button>
              </form>

              <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.85rem', marginTop: '1.25rem' }}>
                ¿Sin cuenta?{' '}
                <Link href="/auth/register" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '500' }}>
                  Regístrate gratis
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


