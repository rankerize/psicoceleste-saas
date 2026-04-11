'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { logout } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, CreditCard } from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { href: '/dashboard/empresas', icon: '🏢', label: 'Gestión de Empresas' },
  { href: '/dashboard/resultados', icon: '📊', label: 'Resultados y Reportes' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      {/* Sidebar */}
      <aside className="sidebar" style={{ position: 'fixed', top: 0, left: 0, bottom: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Logo */}
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🩵</div>
            <span style={{ fontSize: '1rem', fontWeight: '700', color: 'white' }}>PsicoCeleste</span>
          </Link>
        </div>

        {/* Nav top items */}
        <nav style={{ flex: 1, padding: '1.5rem 0.75rem', overflowY: 'auto' }}>
          <div style={{ marginBottom: '1rem', paddingLeft: '0.75rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', color: '#475569', textTransform: 'uppercase' }}>
            Plataforma SaaS
          </div>
          {navItems.map(({ href, icon, label }) => {
            const isActive = pathname === href || (pathname?.startsWith(href) && href !== '/dashboard');
            return (
              <Link key={href} href={href} className={`sidebar-item ${isActive ? 'active' : ''}`}>
                <span style={{ fontSize: '18px', width: '24px', display: 'flex', justifyContent: 'center' }}>{icon}</span>
                <span>{label}</span>
              </Link>
            );
          })}
          
          {/* BOTÓN ADMIN EXCLUSIVO */}
          {(user?.email?.endsWith('@rankerize.com') || user?.email === 'admin@rankerize.com') && (
            <>
              <div style={{ marginTop: '2rem', marginBottom: '0.5rem', paddingLeft: '0.75rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', color: '#475569', textTransform: 'uppercase' }}>
                Administración
              </div>
              <Link href="/dashboard/admin" className={`sidebar-item ${pathname?.startsWith('/dashboard/admin') ? 'active' : ''}`} style={{ background: 'rgba(124, 58, 237, 0.03)', color: '#a78bfa' }}>
                <span style={{ fontSize: '18px', width: '24px', display: 'flex', justifyContent: 'center' }}>👑</span>
                <span>Panel Administrativo</span>
              </Link>
            </>
          )}
        </nav>

        {/* User logout / plans */}
        <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/dashboard/suscripcion" className={`sidebar-item ${pathname === '/dashboard/suscripcion' ? 'active' : ''}`} style={{ marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '16px', width: '24px', display: 'flex', justifyContent: 'center' }}><CreditCard size={18} /></span>
            <span>Plan y Suscripción</span>
          </Link>

          <button 
            onClick={handleLogout}
            className="sidebar-item group" 
            style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', color: '#94a3b8' }}
          >
            <span style={{ fontSize: '16px', width: '24px', display: 'flex', justifyContent: 'center' }} className="group-hover:text-red-400 transition-colors"><LogOut size={18} /></span>
            <span className="group-hover:text-red-400 transition-colors">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: '260px', flex: 1, overflowY: 'auto' }}>
        {/* Top bar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            Bienvenida a PsicoCeleste 👋
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', color: 'white', fontWeight: '600'
            }}>
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        <div style={{ padding: '2rem' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
