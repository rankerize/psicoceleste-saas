'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { logout } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { href: '/dashboard/empresas', icon: '🏢', label: 'Gestión de Empresas' },
  { href: '/dashboard/escaner', icon: '📸', label: 'Escáner AI' },
  { href: '/dashboard/suscripcion', icon: '💳', label: 'Plan y Facturación' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

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

        {/* Nav */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
          {navItems.map(({ href, icon, label }) => (
            <Link key={href} href={href} className="sidebar-item">
              <span style={{ fontSize: '16px' }}>{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
          {/* BOTÓN ADMIN EXCLUSIVO */}
          {(user?.email?.endsWith('@rankerize.com') || user?.email === 'admin@rankerize.com') && (
            <Link href="/dashboard/admin" className="sidebar-item" style={{ marginTop: '0.5rem', background: 'rgba(124, 58, 237, 0.05)', color: '#7c3aed', fontWeight: 600 }}>
              <span style={{ fontSize: '16px' }}>👑</span>
              <span>Panel Admin Rankerize</span>
            </Link>
          )}
        </nav>

        {/* User logout */}
        <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button 
            onClick={handleLogout}
            className="sidebar-item" 
            style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', color: '#ef4444' }}
          >
            <span style={{ fontSize: '16px' }}><LogOut size={16} /></span>
            <span>Cerrar Sesión</span>
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
