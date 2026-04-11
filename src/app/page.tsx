import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen mesh-gradient">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <img 
              src="/logo-psicolab.png" 
              alt="Psicolab Logo" 
              style={{ height: '36px', width: 'auto', borderRadius: '4px' }}
            />
          </div>

          {/* Nav Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <a href="#planes" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.875rem', transition: 'color 0.2s' }}>Planes</a>
            <a href="#como" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.875rem' }}>¿Cómo funciona?</a>
            <a href="#norma" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.875rem' }}>Marco Legal</a>
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link href="/auth/login" className="btn-ghost" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
              Iniciar sesión
            </Link>
            <Link href="/auth/register" className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
              Comenzar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop: '10rem', paddingBottom: '6rem', textAlign: 'center', padding: '10rem 1.5rem 6rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Badge */}
          <div className="badge badge-celeste animate-fade-in" style={{ marginBottom: '1.5rem', fontSize: '0.75rem' }}>
            ✅ Resolución 2404 de 2019 · Min. Trabajo Colombia
          </div>

          <h1 className="animate-fade-in-up" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: '800', lineHeight: '1.1', marginBottom: '1.5rem', color: 'white' }}>
            La batería de riesgo{' '}
            <span className="gradient-text">psicosocial</span>{' '}
            <br />ahora es digital y simple
          </h1>

          <p className="animate-fade-in-up delay-100" style={{ fontSize: '1.15rem', color: '#94a3b8', lineHeight: '1.7', marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
            Software SaaS para psicólogos especializados en SST. Aplica, tabula y genera informes
            de la Batería de Riesgo Psicosocial en minutos, no en días.
          </p>

          <div className="animate-fade-in-up delay-200" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth/register" className="btn-primary" style={{ padding: '0.9rem 2.5rem', fontSize: '1rem' }}>
              Empezar gratis — 3 baterías incluidas
            </Link>
            <a href="#como" className="btn-ghost" style={{ padding: '0.9rem 2rem', fontSize: '1rem' }}>
              Ver cómo funciona →
            </a>
          </div>

          {/* Social proof */}
          <div className="animate-fade-in-up delay-300" style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '3rem', flexWrap: 'wrap' }}>
            {[
              { n: '3.800+', label: 'Empresas evaluadas' },
              { n: '150.000+', label: 'Trabajadores' },
              { n: '900+', label: 'Psicólogos activos' },
            ].map(({ n, label }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div className="gradient-text-celeste" style={{ fontSize: '1.75rem', fontWeight: '800' }}>{n}</div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.25rem' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section id="como" style={{ padding: '4rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', color: 'white', marginBottom: '0.75rem' }}>Todo en una sola plataforma</h2>
          <p style={{ color: '#64748b', fontSize: '1rem' }}>Del censo al informe final, sin calculadoras ni Excel</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {[
            { icon: '🏢', title: 'Gestión de empresas', desc: 'Registra tus clientes y su planta de personal con importación masiva CSV.', color: '#0ea5e9' },
            { icon: '📋', title: 'Cuestionarios digitales', desc: 'Los 4 cuestionarios oficiales (Forma A, B, Extralaboral y Estrés) en formato digital responsive.', color: '#7c3aed' },
            { icon: '🔗', title: 'Link para empleados', desc: 'Comparte un enlace único. Los empleados responden desde cualquier dispositivo.', color: '#059669' },
            { icon: '⚡', title: 'Cálculo automático', desc: 'Motor de calificación oficial: puntaje bruto → percentil → nivel de riesgo por dimensión.', color: '#d97706' },
            { icon: '📊', title: 'Informe PDF profesional', desc: 'Genera el informe completo con gráficas, interpretación IA y firma del psicólogo.', color: '#e11d48' },
            { icon: '📷', title: 'Escaneo de formularios', desc: 'Toma foto a los cuadernillos físicos y el sistema extrae las respuestas automáticamente.', color: '#0891b2' },
          ].map(({ icon, title, desc, color }) => (
            <div key={title} className="glass card-hover" style={{ padding: '1.75rem', borderRadius: '16px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: `${color}20`, border: `1px solid ${color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', marginBottom: '1rem'
              }}>{icon}</div>
              <h3 style={{ color: 'white', fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>{title}</h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: '1.6' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="planes" style={{ padding: '6rem 1.5rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', color: 'white', marginBottom: '0.75rem' }}>Planes simples y transparentes</h2>
          <p style={{ color: '#64748b', marginBottom: '3rem' }}>Sin contratos. Cancela cuando quieras. Paga con MercadoPago.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {/* Starter */}
            <div className="glass card-hover" style={{ padding: '2rem', borderRadius: '20px', textAlign: 'left' }}>
              <div className="badge badge-gray" style={{ marginBottom: '1rem' }}>Starter</div>
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white' }}>$50.000</span>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}> COP · 100 baterías</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                {['100 baterías completas', 'Todos los cuestionarios', 'Informes PDF', 'Soporte por email'].map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                    <span style={{ color: '#34d399' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/auth/register?plan=starter" className="btn-ghost" style={{ display: 'block', textAlign: 'center', width: '100%' }}>
                Comprar paquete
              </Link>
            </div>

            {/* Pro */}
            <div style={{
              padding: '2rem', borderRadius: '20px', textAlign: 'left',
              background: 'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(124,58,237,0.1))',
              border: '1px solid rgba(14,165,233,0.3)',
              boxShadow: '0 0 40px rgba(14,165,233,0.15)',
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute', top: '1rem', right: '1rem',
                background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)',
                borderRadius: '99px', padding: '0.2rem 0.75rem',
                fontSize: '0.7rem', fontWeight: '700', color: 'white'
              }}>RECOMENDADO</div>
              <div className="badge badge-celeste" style={{ marginBottom: '1rem' }}>Pro</div>
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white' }}>$150.000</span>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}> COP / mes</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                {['Baterías ilimitadas', 'Todos los cuestionarios', 'Análisis IA con Gemini', 'Escaneo OCR de formularios', 'Informes PDF profesionales', 'Soporte prioritario'].map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                    <span style={{ color: '#38bdf8' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/auth/register?plan=pro" className="btn-primary" style={{ display: 'block', textAlign: 'center', width: '100%' }}>
                Comenzar con Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Formatos Físicos Descargables */}
      <section id="formatos" style={{ padding: '2rem 1.5rem', maxWidth: '1000px', margin: '4rem auto 0' }}>
        <div className="glass" style={{ padding: '3rem 2rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'linear-gradient(135deg, rgba(8,145,178,0.1), rgba(124,58,237,0.05))', border: '1px solid rgba(14,165,233,0.2)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🖨️</div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'white', marginBottom: '0.75rem' }}>¿Necesitas aplicar la batería en papel impreso?</h2>
            <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '650px', margin: '0 auto', lineHeight: '1.6' }}>
              Descarga aquí los cuadernillos oficiales en PDF listos para imprimir gratis. Más adelante podrás subir las fotos para extraer los datos con nuestro <strong>servicio de OCR (Próximamente)</strong> o digitarlos manualmente.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
            {[
              { title: 'Cuestionario Forma A', sub: 'Jefes y Profesionales', link: '/formatos/Cuestionario_Forma_A.pdf' },
              { title: 'Cuestionario Forma B', sub: 'Auxiliares y Operarios', link: '/formatos/Cuestionario_Forma_B.pdf' },
              { title: 'Ficha de Datos', sub: 'Sociodemográficos y ocupacionales', link: '/formatos/Ficha_Sociodemografica.pdf' },
              { title: 'Factores Extralaborales', sub: 'Cuestionario Extralaboral', link: '/formatos/Cuestionario_Extralaboral.pdf' },
              { title: 'Evaluación de Estrés', sub: 'Cuestionario de síntomas', link: '/formatos/Cuestionario_Estres.pdf' }
            ].map(f => (
              <a key={f.title} href={f.link} target="_blank" rel="noopener noreferrer" 
                 style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', textDecoration: 'none', transition: 'all 0.2s', textAlign: 'center' }}
                 className="card-hover">
                <span style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📄</span>
                <span style={{ color: 'white', fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.25rem' }}>{f.title}</span>
                <span style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '1rem' }}>{f.sub}</span>
                <span className="badge badge-celeste" style={{ marginTop: 'auto' }}>Descargar ↓</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Legal */}
      <section id="norma" style={{ padding: '4rem 1.5rem', maxWidth: '800px', margin: '0 auto' }}>
        <div className="glass" style={{ padding: '2.5rem', borderRadius: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚖️</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'white', marginBottom: '0.75rem' }}>Cumplimiento normativo garantizado</h2>
          <p style={{ color: '#64748b', lineHeight: '1.7', maxWidth: '560px', margin: '0 auto 1.5rem' }}>
            Psicolab implementa el modelo oficial del Ministerio de Trabajo según la{' '}
            <strong style={{ color: '#38bdf8' }}>Resolución 2404 de 2019</strong> y la{' '}
            <strong style={{ color: '#38bdf8' }}>Resolución 2646 de 2008</strong>.
            Las respuestas individuales están protegidas bajo reserva por el psicólogo aplicador.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <span className="badge badge-green">Res. 2404/2019</span>
            <span className="badge badge-celeste">Res. 2646/2008</span>
            <span className="badge badge-gray">Ley 1581/2012 Habeas data</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '2rem 1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <img src="/logo-psicolab.png" alt="Psicolab" style={{ height: '30px', width: 'auto', borderRadius: '4px', filter: 'grayscale(100%) brightness(150%)' }} />
        </div>
        <p style={{ color: '#475569', fontSize: '0.8rem' }}>
          Software especializado para la Batería de Riesgo Psicosocial · Colombia · 2025
        </p>
      </footer>
    </main>
  );
}
