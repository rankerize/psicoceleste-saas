import Link from 'next/link';

const navItems = [
  { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { href: '/dashboard/empresas', icon: '🏢', label: 'Empresas' },
  { href: '/dashboard/empleados', icon: '👥', label: 'Empleados' },
  { href: '/dashboard/aplicaciones', icon: '📋', label: 'Aplicaciones' },
  { href: '/dashboard/resultados', icon: '📊', label: 'Resultados' },
  { href: '/dashboard/suscripcion', icon: '💳', label: 'Facturación' },
  { href: '/dashboard/configuracion', icon: '⚙️', label: 'Configuración' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--navy-900)' }}>
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
        </nav>

        {/* User + plan indicator */}
        <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="glass-celeste" style={{ padding: '0.75rem 1rem', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: '600', marginBottom: '0.2rem' }}>Plan Pro</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Baterías ilimitadas activas</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: '260px', flex: 1, overflowY: 'auto' }}>
        {/* Top bar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(10, 15, 30, 0.9)', backdropFilter: 'blur(20px)',
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
            }}>P</div>
          </div>
        </header>

        <div style={{ padding: '2rem' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
