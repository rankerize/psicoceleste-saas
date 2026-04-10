/**
 * Motor de Calificación: Cuestionario de Estrés (Villalobos, 2010)
 * Fuente: Batería de Instrumentos — Ministerio de la Protección Social
 * Cuestionario para evaluar síntomas de estrés (31 ítems, escala 0-3)
 */

export type NivelRiesgoEstres = 'sin_riesgo' | 'bajo' | 'medio' | 'alto' | 'muy_alto';

export interface ResultadoEstres {
  puntajeBruto: number;
  puntajeTransformado: number;
  nivelRiesgo: NivelRiesgoEstres;
  categorias: {
    fisiologicos: number;
    comportamiento_social: number;
    intelectuales_laborales: number;
    psicoemocionales: number;
  };
}

// ─── Ítems por categoría de síntomas ─────────────────────────────────────────

const ITEMS_FISIOLOGICOS           = [1, 2, 3, 4, 5, 6, 7, 8];
const ITEMS_COMPORTAMIENTO_SOCIAL  = [9, 10, 11, 12];
const ITEMS_INTELECTUALES_LABORALES = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
const ITEMS_PSICOEMOCIONALES       = [23, 24, 25, 26, 27, 28, 29, 30, 31];

// ─── Escala de respuesta del cuestionario de estrés ──────────────────────────
// Siempre=3, Casi siempre=2, A veces=1, Nunca=0  (todos van en misma dirección)

const VALOR_ESTRES: Record<string, number> = {
  siempre:       3,
  casi_siempre:  2,
  algunas_veces: 1,
  nunca:         0,
};

// ─── Factor de transformación ─────────────────────────────────────────────────
// 31 ítems × 3 = 93 puntos máximos

const FACTOR_ESTRES = 93;

// ─── Baremos oficiales (Table del manual, sin diferenciación por cargo) ───────
// Fuente: cuestionario Villalobos 1996/2010 validado en Colombia

const BAREMO_ESTRES = {
  sinRiesgo: [0, 10.7],
  bajo:      [10.8, 17.0],
  medio:     [17.1, 25.0],
  alto:      [25.1, 40.0],
  muyAlto:   [40.1, 100],
};

function clasificarRiesgo(pt: number): NivelRiesgoEstres {
  if (pt <= BAREMO_ESTRES.sinRiesgo[1]) return 'sin_riesgo';
  if (pt <= BAREMO_ESTRES.bajo[1])      return 'bajo';
  if (pt <= BAREMO_ESTRES.medio[1])     return 'medio';
  if (pt <= BAREMO_ESTRES.alto[1])      return 'alto';
  return 'muy_alto';
}

function sumarCategoria(items: number[], respuestas: Record<string, string>): number {
  return items.reduce((acc, i) => acc + (VALOR_ESTRES[respuestas[String(i)]] ?? 0), 0);
}

// ─── Función principal ────────────────────────────────────────────────────────

export function calcularEstres(respuestas: Record<string, string>): ResultadoEstres {
  const fis  = sumarCategoria(ITEMS_FISIOLOGICOS, respuestas);
  const comp = sumarCategoria(ITEMS_COMPORTAMIENTO_SOCIAL, respuestas);
  const int  = sumarCategoria(ITEMS_INTELECTUALES_LABORALES, respuestas);
  const psic = sumarCategoria(ITEMS_PSICOEMOCIONALES, respuestas);

  const bruto = fis + comp + int + psic;
  const transformado = parseFloat(((bruto / FACTOR_ESTRES) * 100).toFixed(1));

  return {
    puntajeBruto: bruto,
    puntajeTransformado: transformado,
    nivelRiesgo: clasificarRiesgo(transformado),
    categorias: {
      fisiologicos: fis,
      comportamiento_social: comp,
      intelectuales_laborales: int,
      psicoemocionales: psic,
    },
  };
}

export const NIVEL_LABEL: Record<NivelRiesgoEstres, string> = {
  sin_riesgo: 'Sin riesgo / Despreciable',
  bajo:       'Riesgo bajo',
  medio:      'Riesgo medio',
  alto:       'Riesgo alto',
  muy_alto:   'Riesgo muy alto',
};

export const CATEGORIAS_LABEL: Record<string, string> = {
  fisiologicos:            'Síntomas fisiológicos',
  comportamiento_social:   'Síntomas de comportamiento social',
  intelectuales_laborales: 'Síntomas intelectuales y laborales',
  psicoemocionales:        'Síntomas psicoemocionales',
};
