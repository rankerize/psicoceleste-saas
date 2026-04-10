/**
 * Template PDF Oficial — Batería de Riesgo Psicosocial
 * PsicoCeleste — Resolución 2646/2008 — Batería MinTrabajo 2010
 */
import React from 'react';
import {
  Document, Page, Text, View, StyleSheet, Font, Svg, Rect, G, Path
} from '@react-pdf/renderer';

// ─── Colores de marca ─────────────────────────────────────────────────────────

const C = {
  navy:    '#0a0f1e',
  navy2:   '#0d1a3d',
  celeste: '#0ea5e9',
  violet:  '#7c3aed',
  emerald: '#10b981',
  amber:   '#f59e0b',
  orange:  '#f97316',
  red:     '#ef4444',
  slate:   '#64748b',
  slateL:  '#94a3b8',
  white:   '#ffffff',
  gray50:  '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray600: '#475569',
  gray800: '#1e293b',
};

const RIESGO_COLOR: Record<string, string> = {
  sin_riesgo: C.emerald,
  bajo:       C.celeste,
  medio:      C.amber,
  alto:       C.orange,
  muy_alto:   C.red,
};

const RIESGO_LABEL: Record<string, string> = {
  sin_riesgo: 'Sin riesgo / Despreciable',
  bajo:       'Riesgo Bajo',
  medio:      'Riesgo Medio',
  alto:       'Riesgo Alto',
  muy_alto:   'Riesgo Muy Alto',
};

// ─── Estilos ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.gray800,
    backgroundColor: C.white,
    paddingHorizontal: 40,
    paddingVertical: 35,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 14,
    borderBottom: `2pt solid ${C.celeste}`,
  },
  logoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoSquare: {
    width: 32,
    height: 32,
    backgroundColor: C.navy2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: C.celeste,
  },
  logoSub: {
    fontSize: 7,
    color: C.slateL,
    marginTop: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerBadge: {
    backgroundColor: C.celeste,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 4,
  },
  headerBadgeText: {
    color: C.white,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerDate: {
    fontSize: 7.5,
    color: C.slateL,
  },

  // Sección de datos
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: C.navy2,
    marginBottom: 8,
    marginTop: 14,
    paddingBottom: 4,
    borderBottom: `1pt solid ${C.gray200}`,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Grid 2 columnas
  grid2: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  card: {
    flex: 1,
    backgroundColor: C.gray50,
    borderRadius: 6,
    padding: 10,
    border: `1pt solid ${C.gray200}`,
  },
  cardTitle: {
    fontSize: 7,
    color: C.slateL,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  cardRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  cardLabel: {
    fontSize: 8,
    color: C.slate,
    width: 95,
  },
  cardValue: {
    fontSize: 8,
    color: C.gray800,
    fontFamily: 'Helvetica-Bold',
    flex: 1,
  },

  // Tabla de resultados
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.navy2,
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  tableHeaderText: {
    color: C.white,
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottom: `0.5pt solid ${C.gray200}`,
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: C.gray50,
  },
  col1: { flex: 3 },
  col2: { flex: 1, textAlign: 'center' },
  col3: { flex: 1.2, textAlign: 'center' },
  colNivel: { flex: 1.8, alignItems: 'center' },

  // Badge de nivel
  nivelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    alignSelf: 'center',
  },
  nivelText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
  },

  // Barra de puntaje
  barContainer: {
    width: 60,
    height: 6,
    backgroundColor: C.gray200,
    borderRadius: 3,
    marginLeft: 6,
  },
  bar: {
    height: 6,
    borderRadius: 3,
  },

  // Dominio header
  dominioRow: {
    flexDirection: 'row',
    backgroundColor: C.navy2,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginTop: 6,
    borderRadius: 4,
    alignItems: 'center',
  },
  dominioText: {
    color: C.white,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    flex: 3,
  },

  // Total general
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.navy2,
    borderRadius: 6,
    padding: 12,
    marginTop: 10,
  },
  totalLabel: {
    color: C.slateL,
    fontSize: 8,
  },
  totalValue: {
    color: C.white,
    fontFamily: 'Helvetica-Bold',
    fontSize: 18,
  },

  // Leyenda
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 7.5,
    color: C.gray600,
    flex: 1,
  },

  // Footer legal
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTop: `0.5pt solid ${C.gray200}`,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 6.5,
    color: C.slateL,
  },
  pageNum: {
    fontSize: 7,
    color: C.slateL,
  },

  // Firma
  firmaBox: {
    flex: 1,
    borderTop: `1pt solid ${C.gray800}`,
    paddingTop: 4,
    marginTop: 24,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  firmaLabel: {
    fontSize: 7.5,
    color: C.slate,
    textAlign: 'center',
  },

  // Recomendaciones
  recomBox: {
    backgroundColor: '#fff7ed',
    border: `1pt solid ${C.amber}`,
    borderRadius: 6,
    padding: 10,
    marginTop: 6,
  },
  recomText: {
    fontSize: 8,
    color: C.gray600,
    lineHeight: 1.4,
  },

  alertBox: {
    backgroundColor: '#fef2f2',
    border: `1pt solid ${C.red}`,
    borderRadius: 6,
    padding: 10,
    marginTop: 6,
  },
});

// ─── Utilidades ───────────────────────────────────────────────────────────────

function BadgeNivel({ nivel }: { nivel: string }) {
  const color = RIESGO_COLOR[nivel] ?? C.slate;
  const label = RIESGO_LABEL[nivel] ?? nivel;
  return (
    <View style={[s.nivelBadge, { backgroundColor: color }]}>
      <Text style={s.nivelText}>{label}</Text>
    </View>
  );
}

function BarScore({ puntaje, nivel }: { puntaje: number; nivel: string }) {
  const color = RIESGO_COLOR[nivel] ?? C.slate;
  const width = Math.min(100, Math.max(0, puntaje));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ fontSize: 8, color: C.gray600, width: 28 }}>{puntaje.toFixed(1)}</Text>
      <View style={s.barContainer}>
        <View style={[s.bar, { width: `${width}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function FilaInfo({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.cardRow}>
      <Text style={s.cardLabel}>{label}</Text>
      <Text style={s.cardValue}>{value || '—'}</Text>
    </View>
  );
}

// ─── Tipos de datos ───────────────────────────────────────────────────────────

interface DimResult { puntajeTransformado: number; nivelRiesgo: string; }
interface DomResult { nombre: string; puntajeTransformado: number; nivelRiesgo: string; dimensiones?: Record<string, DimResult>; }

export interface PDFData {
  empleado: {
    nombre: string;
    cedula: string;
    cargo: string;
    area: string;
    empresa: string;
    nit: string;
    tipoCargo: string;
  };
  psicologo: {
    nombre: string;
    tarjeta: string;
    licencia?: string;
    especializacion?: string;
  };
  fecha: string;
  forma: 'A' | 'B';
  intra: {
    dominios: Record<string, DomResult>;
    dimensiones?: Record<string, DimResult>;
    totalIntralaboral: { transformado: number; nivelRiesgo: string };
  };
  extra: {
    dimensiones: { dimension: string; puntajeTransformado: number; nivelRiesgo: string }[];
    puntajeTransformadoTotal: number;
    nivelRiesgoTotal: string;
  };
  estres: {
    puntajeTransformado: number;
    nivelRiesgo: string;
    categorias: Record<string, number>;
  };
}

// ─── Nombres legibles ─────────────────────────────────────────────────────────

const DOMINIO_NOMBRE: Record<string, string> = {
  liderazgo_relaciones: 'Liderazgo y Relaciones Sociales en el Trabajo',
  control:              'Control sobre el Trabajo',
  demandas:             'Demandas del Trabajo',
  recompensas:          'Recompensas',
};

const DIM_NOMBRE: Record<string, string> = {
  caracteristicas_liderazgo:   'Características del liderazgo',
  relaciones_sociales:         'Relaciones sociales en el trabajo',
  retroalimentacion_desempeno: 'Retroalimentación del desempeño',
  relacion_colaboradores:      'Relación con colaboradores',
  claridad_rol:                'Claridad de rol',
  capacitacion:                'Capacitación',
  participacion_cambio:        'Participación y manejo del cambio',
  oportunidades_habilidades:   'Uso y desarrollo de habilidades',
  control_autonomia:           'Control y autonomía sobre el trabajo',
  demandas_ambientales:        'Demandas ambientales y de esfuerzo físico',
  demandas_emocionales:        'Demandas emocionales',
  demandas_cuantitativas:      'Demandas cuantitativas',
  influencia_extralaboral:     'Influencia del trabajo sobre el entorno extralaboral',
  exigencias_responsabilidad:  'Exigencias de responsabilidad del cargo',
  demandas_carga_mental:       'Demandas de carga mental',
  consistencia_rol:            'Consistencia del rol',
  demandas_jornada:            'Demandas de la jornada de trabajo',
  recompensas_pertenencia:     'Recompensas derivadas de la pertenencia',
  reconocimiento_compensacion: 'Reconocimiento y compensación',
};

const EXTRA_DIM_NOMBRE: Record<string, string> = {
  tiempo_fuera:            'Tiempo fuera del trabajo',
  relaciones_familiares:   'Relaciones familiares',
  comunicacion_relaciones: 'Comunicación y relaciones interpersonales',
  situacion_economica:     'Situación económica del grupo familiar',
  vivienda_entorno:        'Características de la vivienda y su entorno',
  influencia_extralaboral: 'Influencia del entorno extralaboral sobre el trabajo',
  desplazamiento:          'Desplazamiento vivienda–trabajo–vivienda',
};

const ESTRES_CAT: Record<string, string> = {
  fisiologicos:            'Síntomas fisiológicos',
  comportamiento_social:   'Síntomas de comportamiento social',
  intelectuales_laborales: 'Síntomas intelectuales y laborales',
  psicoemocionales:        'Síntomas psicoemocionales',
};

const RECOMENDACIONES: Record<string, string> = {
  sin_riesgo: 'Las dimensiones en esta categoría son objeto de acciones o programas de promoción para mantener los bajos niveles de riesgo.',
  bajo:       'Se recomienda mantener e implementar acciones preventivas. No se esperan síntomas de estrés significativos.',
  medio:      'Se requiere observación sistemática e intervención. Se esperaría una respuesta de estrés moderada en estas áreas.',
  alto:       'Se requiere intervención en el marco de vigilancia epidemiológica. Alta posibilidad de asociación con estrés elevado.',
  muy_alto:   'INTERVENCIÓN INMEDIATA requerida. Las dimensiones en esta categoría se asocian con respuestas muy altas de estrés. Debe incluirse en el programa de vigilancia epidemiológica de manera prioritaria.',
};

// ─── Componente PDF principal ─────────────────────────────────────────────────

export function ReportePDF({ data }: { data: PDFData }) {
  const now = data.fecha;

  // Determinar nivel general más alto
  const nivelesOrden = ['sin_riesgo', 'bajo', 'medio', 'alto', 'muy_alto'];
  const nivelIntra = data.intra.totalIntralaboral.nivelRiesgo;
  const nivelExtra = data.extra.nivelRiesgoTotal;
  const nivelEstres = data.estres.nivelRiesgo;
  const idxGlobal = Math.max(
    nivelesOrden.indexOf(nivelIntra),
    nivelesOrden.indexOf(nivelExtra),
    nivelesOrden.indexOf(nivelEstres),
  );
  const nivelGlobal = nivelesOrden[idxGlobal] ?? 'sin_riesgo';

  return (
    <Document
      title={`Perfil Riesgo Psicosocial — ${data.empleado.nombre}`}
      author="PsicoCeleste"
      subject="Batería de Riesgo Psicosocial — MinTrabajo 2010"
      creator="PsicoCeleste SaaS"
    >

      {/* ═══════════════════════════════════════════════════════
          PÁGINA 1 — Datos generales + Intralaboral
          ═══════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View style={s.logoBox}>
            <View style={s.logoSquare}>
              <Text style={{ color: C.celeste, fontSize: 14, fontFamily: 'Helvetica-Bold' }}>🩵</Text>
            </View>
            <View>
              <Text style={s.logoText}>PsicoCeleste</Text>
              <Text style={s.logoSub}>Batería de Riesgo Psicosocial</Text>
            </View>
          </View>
          <View style={s.headerRight}>
            <View style={s.headerBadge}>
              <Text style={s.headerBadgeText}>Informe de Resultados — Intralaboral Forma {data.forma}</Text>
            </View>
            <Text style={s.headerDate}>Fecha: {now}</Text>
            <Text style={s.headerDate}>Resolución 2646/2008 — Batería MinTrabajo 2010</Text>
          </View>
        </View>

        {/* Datos trabajador + Datos evaluador */}
        <View style={s.grid2}>
          <View style={s.card}>
            <Text style={s.cardTitle}>Datos del Trabajador</Text>
            <FilaInfo label="Nombre completo" value={data.empleado.nombre} />
            <FilaInfo label="Cédula (ID)" value={data.empleado.cedula} />
            <FilaInfo label="Cargo" value={data.empleado.cargo} />
            <FilaInfo label="Área / Departamento" value={data.empleado.area} />
            <FilaInfo label="Empresa" value={data.empleado.empresa} />
            <FilaInfo label="NIT" value={data.empleado.nit} />
            <FilaInfo label="Nivel de cargo" value={data.empleado.tipoCargo} />
          </View>
          <View style={s.card}>
            <Text style={s.cardTitle}>Datos del Evaluador</Text>
            <FilaInfo label="Psicólogo(a)" value={data.psicologo.nombre} />
            <FilaInfo label="Tarjeta profesional" value={data.psicologo.tarjeta} />
            <FilaInfo label="Especialización" value={data.psicologo.especializacion ?? ''} />
            <FilaInfo label="Licencia SO" value={data.psicologo.licencia ?? 'Pendiente'} />
            <FilaInfo label="Cuestionario aplicado" value={`Forma ${data.forma} — Intralaboral`} />
            <FilaInfo label="Fecha de aplicación" value={now} />
          </View>
        </View>

        {/* Total general */}
        <View style={s.totalBox}>
          <View>
            <Text style={s.totalLabel}>Puntaje total intralaboral (transformado)</Text>
            <Text style={[s.totalLabel, { marginTop: 2 }]}>
              Nivel de riesgo general
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.totalValue}>{data.intra.totalIntralaboral.transformado.toFixed(1)}</Text>
            <BadgeNivel nivel={nivelIntra} />
          </View>
        </View>

        {/* Resultados intralaboral */}
        <Text style={s.sectionTitle}>Resultados del Cuestionario Intralaboral</Text>

        {/* Cabecera tabla */}
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderText, s.col1]}>Dominio / Dimensión</Text>
          <Text style={[s.tableHeaderText, s.col2]}>Puntaje</Text>
          <Text style={[s.tableHeaderText, s.colNivel, { textAlign: 'center' }]}>Nivel de riesgo</Text>
        </View>

        {/* Filas por dominio */}
        {Object.entries(data.intra.dominios).map(([domId, dom], di) => (
          <View key={domId}>
            {/* Dominio */}
            <View style={s.dominioRow}>
              <Text style={s.dominioText}>{DOMINIO_NOMBRE[domId] ?? domId}</Text>
              <View style={[s.col2, { alignItems: 'center' }]}>
                <Text style={{ color: C.slateL, fontSize: 8 }}>{dom.puntajeTransformado.toFixed(1)}</Text>
              </View>
              <View style={[s.colNivel]}>
                <BadgeNivel nivel={dom.nivelRiesgo} />
              </View>
            </View>

            {/* Dimensiones del dominio */}
            {dom.dimensiones && Object.entries(dom.dimensiones).map(([dimId, dim], idx) => (
              <View key={dimId} style={[s.tableRow, idx % 2 === 0 ? s.tableRowAlt : {}]}>
                <Text style={[s.col1, { fontSize: 8, color: C.gray600, paddingLeft: 10 }]}>
                  {DIM_NOMBRE[dimId] ?? dimId}
                </Text>
                <View style={[s.col2, { alignItems: 'center' }]}>
                  <BarScore puntaje={dim.puntajeTransformado} nivel={dim.nivelRiesgo} />
                </View>
                <View style={s.colNivel}>
                  <BadgeNivel nivel={dim.nivelRiesgo} />
                </View>
              </View>
            ))}
          </View>
        ))}

        {/* Recomendación intralaboral */}
        {(nivelIntra === 'alto' || nivelIntra === 'muy_alto') ? (
          <View style={s.alertBox}>
            <Text style={[s.recomText, { fontFamily: 'Helvetica-Bold', marginBottom: 3 }]}>
              ⚠ Intervención requerida
            </Text>
            <Text style={s.recomText}>{RECOMENDACIONES[nivelIntra]}</Text>
          </View>
        ) : (
          <View style={s.recomBox}>
            <Text style={s.recomText}>{RECOMENDACIONES[nivelIntra]}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            PsicoCeleste SaaS — Res. 2646/2008 — Batería MinTrabajo 2010 — Página 1
          </Text>
          <Text style={s.pageNum}>{data.empleado.nombre}</Text>
        </View>
      </Page>

      {/* ═══════════════════════════════════════════════════════
          PÁGINA 2 — Extralaboral + Estrés + Perfil global + Firma
          ═══════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>

        {/* Mini header */}
        <View style={[s.header, { marginBottom: 10 }]}>
          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.navy2 }}>
            🩵 PsicoCeleste — Continuación del Informe
          </Text>
          <Text style={s.headerDate}>{data.empleado.nombre} — {now}</Text>
        </View>

        {/* ── Extralaboral ── */}
        <Text style={s.sectionTitle}>Resultados Cuestionario Extralaboral</Text>

        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderText, s.col1]}>Dimensión</Text>
          <Text style={[s.tableHeaderText, s.col2]}>Puntaje</Text>
          <Text style={[s.tableHeaderText, s.colNivel, { textAlign: 'center' }]}>Nivel de riesgo</Text>
        </View>

        {data.extra.dimensiones.map((dim, idx) => (
          <View key={dim.dimension} style={[s.tableRow, idx % 2 === 0 ? s.tableRowAlt : {}]}>
            <Text style={[s.col1, { fontSize: 8 }]}>{EXTRA_DIM_NOMBRE[dim.dimension] ?? dim.dimension}</Text>
            <View style={[s.col2, { alignItems: 'center' }]}>
              <BarScore puntaje={dim.puntajeTransformado} nivel={dim.nivelRiesgo} />
            </View>
            <View style={s.colNivel}>
              <BadgeNivel nivel={dim.nivelRiesgo} />
            </View>
          </View>
        ))}

        {/* Total extralaboral */}
        <View style={[s.totalBox, { marginTop: 8, paddingVertical: 8 }]}>
          <Text style={s.totalLabel}>Total Extralaboral</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={[s.totalValue, { fontSize: 14 }]}>
              {data.extra.puntajeTransformadoTotal.toFixed(1)}
            </Text>
            <BadgeNivel nivel={nivelExtra} />
          </View>
        </View>

        {/* ── Estrés ── */}
        <Text style={s.sectionTitle}>Resultados Cuestionario de Estrés</Text>

        <View style={s.grid2}>
          <View style={s.card}>
            <Text style={s.cardTitle}>Categorías de síntomas</Text>
            {Object.entries(data.estres.categorias).map(([cat, val]) => (
              <View key={cat} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 8, color: C.gray600 }}>{ESTRES_CAT[cat] ?? cat}</Text>
                <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.gray800 }}>{val} pts</Text>
              </View>
            ))}
          </View>
          <View style={[s.card, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 8, color: C.slateL, marginBottom: 6 }}>Nivel general de estrés</Text>
            <Text style={{ fontSize: 28, fontFamily: 'Helvetica-Bold', color: RIESGO_COLOR[nivelEstres] ?? C.slate }}>
              {data.estres.puntajeTransformado.toFixed(1)}
            </Text>
            <BadgeNivel nivel={nivelEstres} />
            <Text style={{ fontSize: 7, color: C.slateL, marginTop: 6 }}>Puntaje transformado (0-100)</Text>
          </View>
        </View>

        {/* ── Perfil Global de Riesgo ── */}
        <Text style={s.sectionTitle}>Perfil Global de Riesgo Psicosocial</Text>

        <View style={[s.totalBox, { marginBottom: 10 }]}>
          <View>
            <Text style={[s.totalLabel, { marginBottom: 6 }]}>Nivel de riesgo más alto identificado</Text>
            <BadgeNivel nivel={nivelGlobal} />
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 7, color: C.slateL, marginBottom: 4 }}>Resumen por instrumento</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { label: `Intra (F.${data.forma})`, nivel: nivelIntra },
                { label: 'Extralaboral',  nivel: nivelExtra },
                { label: 'Estrés',        nivel: nivelEstres },
              ].map(r => (
                <View key={r.label} style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 6.5, color: C.slateL, marginBottom: 2 }}>{r.label}</Text>
                  <BadgeNivel nivel={r.nivel} />
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Leyenda */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Interpretación genérica de los niveles de riesgo</Text>
          {Object.entries(RECOMENDACIONES).map(([nivel, texto]) => (
            <View key={nivel} style={[s.legendRow, { marginBottom: 5 }]}>
              <View style={[s.legendDot, { backgroundColor: RIESGO_COLOR[nivel] ?? C.slate }]} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: RIESGO_COLOR[nivel] ?? C.slate }}>
                  {RIESGO_LABEL[nivel]}
                </Text>
                <Text style={s.legendText}>{texto}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Observaciones */}
        <View style={[s.card, { marginTop: 10, minHeight: 50 }]}>
          <Text style={s.cardTitle}>Observaciones y comentarios del evaluador</Text>
          <Text style={{ fontSize: 8, color: C.slateL, fontStyle: 'italic' }}>
            (El psicólogo evaluador puede agregar observaciones específicas aquí)
          </Text>
        </View>

        {/* Firma */}
        <View style={{ flexDirection: 'row', marginTop: 20 }}>
          <View style={s.firmaBox}>
            <Text style={s.firmaLabel}>{data.psicologo.nombre}</Text>
            <Text style={[s.firmaLabel, { marginTop: 2 }]}>
              Tarjeta profesional: {data.psicologo.tarjeta}
            </Text>
            <Text style={s.firmaLabel}>Psicólogo(a) evaluador(a)</Text>
          </View>
          <View style={s.firmaBox}>
            <Text style={s.firmaLabel}>Fecha de elaboración</Text>
            <Text style={[s.firmaLabel, { marginTop: 2 }]}>{now}</Text>
            <Text style={s.firmaLabel}>Firma y sello</Text>
          </View>
        </View>

        {/* Nota legal */}
        <View style={{ marginTop: 14, backgroundColor: C.gray50, borderRadius: 4, padding: 8, border: `0.5pt solid ${C.gray200}` }}>
          <Text style={{ fontSize: 6.5, color: C.slateL, lineHeight: 1.4 }}>
            * Todo informe que carezca de los datos del evaluador (nombre, tarjeta profesional y licencia en salud ocupacional) no será válido.
            Evaluación realizada conforme a la Resolución 2646 de 2008 del Ministerio de la Protección Social y la Batería de Instrumentos
            para la Evaluación de Factores de Riesgo Psicosocial (2010). Los resultados deben ser interpretados por un psicólogo(a)
            con especialización en salud ocupacional y licencia vigente de prestación de servicios en psicología ocupacional.
            Generado por PsicoCeleste SaaS — psicoceleste.com
          </Text>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            PsicoCeleste SaaS — Res. 2646/2008 — Batería MinTrabajo 2010 — Página 2 de 2
          </Text>
          <Text style={s.pageNum}>{data.empleado.nombre}</Text>
        </View>
      </Page>
    </Document>
  );
}
