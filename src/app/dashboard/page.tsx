export default function DashboardPage() {
  const stats = [
    { label: 'Empresas activas', value: '0', icon: '🏢', color: '#0ea5e9', change: '' },
    { label: 'Empleados censados', value: '0', icon: '👥', color: '#7c3aed', change: '' },
    { label: 'Baterías aplicadas', value: '0', icon: '📋', color: '#059669', change: '' },
    { label: 'Informes generados', value: '0', icon: '📊', color: '#d97706', change: '' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'white', marginBottom: '0.35rem' }}>
          Panel de Control
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Gestiona tus empresas, empleados y aplica la Batería de Riesgo Psicosocial
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {stats.map(({ label, value, icon, color }) => (
          <div key={label} className="glass card-hover" style={{ padding: '1.5rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: `${color}20`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{icon}</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'white', marginBottom: '0.25rem' }}>{value}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Inicio rápido */}
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '700', color: 'white', marginBottom: '1rem' }}>🚀 Inicio rápido</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {[
              { label: 'Agregar empresa cliente', href: '/dashboard/empresas/nueva', icon: '➕' },
              { label: 'Crear nueva aplicación', href: '/dashboard/aplicaciones/nueva', icon: '📋' },
              { label: 'Ver mis resultados', href: '/dashboard/resultados', icon: '📊' },
            ].map(({ label, href, icon }) => (
              <a key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                borderRadius: '10px', textDecoration: 'none', color: '#94a3b8', fontSize: '0.875rem',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                transition: 'all 0.2s ease'
              }}>
                <span>{icon}</span>
                <span>{label}</span>
                <span style={{ marginLeft: 'auto', color: '#475569' }}>→</span>
              </a>
            ))}
          </div>
        </div>

        {/* Marco legal */}
        <div style={{
          padding: '1.75rem', borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(14,165,233,0.08), rgba(124,58,237,0.06))',
          border: '1px solid rgba(14,165,233,0.15)'
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '700', color: 'white', marginBottom: '0.5rem' }}>⚖️ Marco normativo</h2>
          <p style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: '1.6', marginBottom: '1rem' }}>
            Esta plataforma implementa la Batería oficial del Ministerio de Trabajo según la Res. 2404/2019 y Res. 2646/2008.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge badge-celeste">Res. 2404/2019</span>
            <span className="badge badge-gray">Res. 2646/2008</span>
          </div>
        </div>
      </div>

      {/* Empty state - recent activity */}
      <div className="glass" style={{ padding: '3rem', borderRadius: '16px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
        <h3 style={{ color: 'white', fontWeight: '600', marginBottom: '0.5rem' }}>Sin actividad aún</h3>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          Comienza agregando tu primera empresa cliente y censando sus empleados.
        </p>
        <a href="/dashboard/empresas/nueva" className="btn-primary">
          Agregar primera empresa
        </a>
      </div>
    </div>
  );
}
