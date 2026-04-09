/**
 * Motor de Calificación Oficial — Cuestionario Intralaboral
 * Basado en: Batería de Instrumentos para la Evaluación de Factores de Riesgo Psicosocial
 * Ministerio de la Protección Social / Pontificia Universidad Javeriana - 2010
 * Resolución 2404 de 2019
 */

export type RiskLevel = 'sin_riesgo' | 'bajo' | 'medio' | 'alto' | 'muy_alto';

export interface ItemScore {
  itemNum: number;
  respuesta: 0 | 1 | 2 | 3 | 4; // 0=Siempre, 1=Casi siempre, 2=A veces, 3=Casi nunca, 4=Nunca
  puntaje: number;
}

export interface DimensionResult {
  nombre: string;
  puntajeBruto: number;
  puntajeTransformado: number;
  nivelRiesgo: RiskLevel;
  interpretacion: string;
}

export interface DominioResult {
  nombre: string;
  puntajeBruto: number;
  puntajeTransformado: number;
  nivelRiesgo: RiskLevel;
}

export interface IntraResult {
  forma: 'A' | 'B';
  dimensiones: Record<string, DimensionResult>;
  dominios: Record<string, DominioResult>;
  totalIntralaboral: { bruto: number; transformado: number; nivelRiesgo: RiskLevel };
}

// ─── TABLA 21 y 22: Ítems con puntuación INVERSA (Siempre=4, Nunca=0) ───────
// Todos los demás: Siempre=0, Nunca=4

const ITEMS_INVERTIDOS_FORMA_A = new Set([
  1, 2, 3, 7, 8, 10, 11, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
  27, 28, 29, 30, 31, 33, 35, 36, 37, 38, 52, 80, 106, 107, 108, 109, 110,
  111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123,
]);

const ITEMS_INVERTIDOS_FORMA_B = new Set([
  1, 2, 3, 7, 8, 10, 11, 13, 15, 16, 17, 18, 19, 20, 21, 23, 25, 26, 27, 28,
  66, 89, 90, 91, 92, 93, 94, 95, 96,
]);

// ─── TABLA 23: Ítems por dimensión ───────────────────────────────────────────

export const ITEMS_POR_DIMENSION: Record<string, { A: number[]; B: number[] }> = {
  caracteristicas_liderazgo: {
    A: [63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75],
    B: [49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61],
  },
  relaciones_sociales: {
    A: [76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89],
    B: [62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73],
  },
  retroalimentacion_desempeno: {
    A: [90, 91, 92, 93, 94],
    B: [74, 75, 76, 77, 78],
  },
  relacion_colaboradores: {
    A: [115, 116, 117, 118, 119, 120, 121, 122, 123],
    B: [], // No aplica en Forma B
  },
  claridad_rol: {
    A: [53, 54, 55, 56, 57, 58, 59],
    B: [41, 42, 43, 44, 45],
  },
  capacitacion: {
    A: [60, 61, 62],
    B: [46, 47, 48],
  },
  participacion_cambio: {
    A: [48, 49, 50, 51],
    B: [38, 39, 40],
  },
  oportunidades_habilidades: {
    A: [39, 40, 41, 42],
    B: [29, 30, 31, 32],
  },
  control_autonomia: {
    A: [44, 45, 46],
    B: [34, 35, 36],
  },
  demandas_ambientales: {
    A: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    B: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  },
  demandas_emocionales: {
    A: [106, 107, 108, 109, 110, 111, 112, 113, 114],
    B: [89, 90, 91, 92, 93, 94, 95, 96, 97],
  },
  demandas_cuantitativas: {
    A: [13, 14, 15, 32, 43, 47],
    B: [13, 14, 15],
  },
  influencia_extralaboral: {
    A: [35, 36, 37, 38],
    B: [25, 26, 27, 28],
  },
  exigencias_responsabilidad: {
    A: [19, 22, 23, 24, 25, 26],
    B: [], // No evalúa en Forma B
  },
  demandas_carga_mental: {
    A: [16, 17, 18, 20, 21],
    B: [16, 17, 18, 19, 20],
  },
  consistencia_rol: {
    A: [27, 28, 29, 30, 52],
    B: [], // No evalúa en Forma B
  },
  demandas_jornada: {
    A: [31, 33, 34],
    B: [21, 22, 23, 24, 33, 37],
  },
  recompensas_pertenencia: {
    A: [95, 102, 103, 104, 105],
    B: [85, 86, 87, 88],
  },
  reconocimiento_compensacion: {
    A: [96, 97, 98, 99, 100, 101],
    B: [79, 80, 81, 82, 83, 84],
  },
};

// ─── TABLA 25: Factores de transformación por dimensión ──────────────────────

const FACTORES_TRANSFORMACION_DIMENSION: Record<string, { A: number; B: number }> = {
  caracteristicas_liderazgo:     { A: 52, B: 52 },
  relaciones_sociales:           { A: 56, B: 48 },
  retroalimentacion_desempeno:   { A: 20, B: 20 },
  relacion_colaboradores:        { A: 36, B: 0 },
  claridad_rol:                  { A: 28, B: 20 },
  capacitacion:                  { A: 12, B: 12 },
  participacion_cambio:          { A: 16, B: 12 },
  oportunidades_habilidades:     { A: 16, B: 16 },
  control_autonomia:             { A: 12, B: 12 },
  demandas_ambientales:          { A: 48, B: 48 },
  demandas_emocionales:          { A: 36, B: 36 },
  demandas_cuantitativas:        { A: 24, B: 12 },
  influencia_extralaboral:       { A: 16, B: 16 },
  exigencias_responsabilidad:    { A: 24, B: 0 },
  demandas_carga_mental:         { A: 20, B: 20 },
  consistencia_rol:              { A: 20, B: 0 },
  demandas_jornada:              { A: 12, B: 24 },
  recompensas_pertenencia:       { A: 20, B: 16 },
  reconocimiento_compensacion:   { A: 24, B: 24 },
};

// ─── TABLA 26: Factores de transformación por dominio ────────────────────────

const FACTORES_DOMINIO: Record<string, { A: number; B: number }> = {
  liderazgo_relaciones:  { A: 164, B: 120 },
  control:               { A: 84,  B: 72  },
  demandas:              { A: 200, B: 156 },
  recompensas:           { A: 44,  B: 40  },
};

// ─── TABLA 27: Factores de transformación total ───────────────────────────────

const FACTOR_TOTAL = { A: 492, B: 388 };
const FACTOR_TOTAL_GENERAL = { A: 616, B: 512 }; // intra + extralaboral

// ─── TABLAS 29 y 30: Baremos por dimensión ───────────────────────────────────
// Formato: [max_sin_riesgo, max_bajo, max_medio, max_alto] → muy_alto = resto

type Baremos = [number, number, number, number];

const BAREMOS_DIMENSIONES: Record<string, { A: Baremos; B: Baremos }> = {
  caracteristicas_liderazgo:   { A: [3.8, 15.4, 30.8, 46.2],  B: [3.8, 13.5, 25.0, 38.5]  },
  relaciones_sociales:         { A: [5.4, 16.1, 25.0, 37.5],  B: [6.3, 14.6, 27.1, 37.5]  },
  retroalimentacion_desempeno: { A: [10.0, 25.0, 40.0, 55.0], B: [5.0, 20.0, 30.0, 50.0]  },
  relacion_colaboradores:      { A: [13.9, 25.0, 33.3, 47.2], B: [0, 0, 0, 0]              },
  claridad_rol:                { A: [0.9, 10.7, 21.4, 39.3],  B: [0.9, 5.0, 15.0, 30.0]   },
  capacitacion:                { A: [0.9, 16.7, 33.3, 50.0],  B: [0.9, 16.7, 25.0, 50.0]  },
  participacion_cambio:        { A: [12.5, 25.0, 37.5, 50.0], B: [16.7, 33.3, 41.7, 58.3] },
  oportunidades_habilidades:   { A: [0.9, 6.3, 18.8, 31.3],  B: [12.5, 25.0, 37.5, 56.3] },
  control_autonomia:           { A: [8.3, 25.0, 41.7, 58.3],  B: [33.3, 50.0, 66.7, 75.0] },
  demandas_ambientales:        { A: [14.6, 22.9, 31.3, 39.6], B: [22.9, 31.3, 39.6, 47.9] },
  demandas_emocionales:        { A: [16.7, 25.0, 33.3, 47.2], B: [19.4, 27.8, 38.9, 47.2] },
  demandas_cuantitativas:      { A: [25.0, 33.3, 45.8, 54.2], B: [16.7, 33.3, 41.7, 50.0] },
  influencia_extralaboral:     { A: [18.8, 31.3, 43.8, 50.0], B: [12.5, 25.0, 31.3, 50.0] },
  exigencias_responsabilidad:  { A: [37.5, 54.2, 66.7, 79.2], B: [0, 0, 0, 0]              },
  demandas_carga_mental:       { A: [60.0, 70.0, 80.0, 90.0], B: [50.0, 65.0, 75.0, 85.0] },
  consistencia_rol:            { A: [15.0, 25.0, 35.0, 45.0], B: [0, 0, 0, 0]              },
  demandas_jornada:            { A: [8.3, 25.0, 33.3, 50.0],  B: [25.0, 37.5, 45.8, 58.3] },
  recompensas_pertenencia:     { A: [0.9, 5.0, 10.0, 20.0],   B: [0.9, 6.3, 12.5, 18.8]   },
  reconocimiento_compensacion: { A: [4.2, 16.7, 25.0, 37.5],  B: [0.9, 12.5, 25.0, 37.5]  },
};

// ─── TABLAS 31 y 32: Baremos por dominio ─────────────────────────────────────

const BAREMOS_DOMINIOS: Record<string, { A: Baremos; B: Baremos }> = {
  liderazgo_relaciones: { A: [9.1, 17.7, 25.6, 34.8],  B: [8.3, 17.5, 26.7, 38.3] },
  control:              { A: [10.7, 19.0, 29.8, 40.5], B: [19.4, 26.4, 34.7, 43.1] },
  demandas:             { A: [28.5, 35.0, 41.5, 47.5], B: [26.9, 33.3, 37.8, 44.2] },
  recompensas:          { A: [4.5, 11.4, 20.5, 29.5],  B: [2.5, 10.0, 17.5, 27.5]  },
};

// ─── TABLA 33: Baremos para el total ─────────────────────────────────────────

const BAREMOS_TOTAL = {
  A: [19.7, 25.8, 31.5, 38.0] as Baremos,
  B: [20.6, 26.0, 31.2, 38.7] as Baremos,
};

// ─── Utilidades ──────────────────────────────────────────────────────────────

function getRiskLevel(score: number, baremos: Baremos): RiskLevel {
  if (score <= baremos[0]) return 'sin_riesgo';
  if (score <= baremos[1]) return 'bajo';
  if (score <= baremos[2]) return 'medio';
  if (score <= baremos[3]) return 'alto';
  return 'muy_alto';
}

function transformScore(bruto: number, factor: number): number {
  if (factor === 0) return 0;
  return Math.round((bruto / factor) * 1000) / 10;
}

export const RISK_LABELS: Record<RiskLevel, string> = {
  sin_riesgo: 'Sin riesgo / Despreciable',
  bajo:       'Riesgo Bajo',
  medio:      'Riesgo Medio',
  alto:       'Riesgo Alto',
  muy_alto:   'Riesgo Muy Alto',
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  sin_riesgo: '#34d399',
  bajo:       '#60a5fa',
  medio:      '#fbbf24',
  alto:       '#fb923c',
  muy_alto:   '#f87171',
};

export const RISK_INTERPRETATIONS: Record<RiskLevel, string> = {
  sin_riesgo: 'Ausencia de riesgo o riesgo tan bajo que no amerita intervención. Acciones de promoción.',
  bajo:       'No se esperan síntomas o respuestas de estrés significativas. Mantener con acciones preventivas.',
  medio:      'Se espera respuesta de estrés moderada. Requiere observación y acciones sistemáticas de intervención.',
  alto:       'Importante posibilidad de estrés alto. Requiere intervención en marco de vigilancia epidemiológica.',
  muy_alto:   'Amplia posibilidad de estrés muy alto. Requiere intervención inmediata y vigilancia epidemiológica.',
};

// ─── FUNCIÓN PRINCIPAL DE CALIFICACIÓN ───────────────────────────────────────

export function calificarIntralaboral(
  forma: 'A' | 'B',
  respuestas: Record<number, 0 | 1 | 2 | 3 | 4>,
  esMandoSinJefe: boolean = false,
  tieneClientesUsuarios: boolean = true,
  esJefeDePersonas: boolean = false,
): IntraResult {
  const invertidos = forma === 'A' ? ITEMS_INVERTIDOS_FORMA_A : ITEMS_INVERTIDOS_FORMA_B;

  // Paso 1: Calificar cada ítem (convertir respuesta a puntaje)
  const puntajes: Record<number, number> = {};
  for (const [itemStr, respuesta] of Object.entries(respuestas)) {
    const item = parseInt(itemStr);
    puntajes[item] = invertidos.has(item) ? respuesta : (4 - respuesta);
  }

  // Demandas emocionales = 0 si no atiende clientes
  if (!tieneClientesUsuarios) {
    const itemsEmoc = ITEMS_POR_DIMENSION.demandas_emocionales[forma];
    itemsEmoc.forEach(i => { puntajes[i] = 0; });
  }

  // Relación con colaboradores = 0 si no es jefe (solo forma A)
  if (!esJefeDePersonas && forma === 'A') {
    ITEMS_POR_DIMENSION.relacion_colaboradores.A.forEach(i => { puntajes[i] = 0; });
  }

  // Si es máximo jefe sin jefe → ítems liderazgo = 0
  if (esMandoSinJefe) {
    const itemsLiderazgo = forma === 'A' ? [63,64,65,66,67,68,69,70,71,72,73,74,75] : [49,50,51,52,53,54,55,56,57,58,59,60,61];
    itemsLiderazgo.forEach(i => { puntajes[i] = 0; });
  }

  // Paso 2: Puntajes brutos por dimensión
  const dimensiones: Record<string, DimensionResult> = {};

  for (const [dim, itms] of Object.entries(ITEMS_POR_DIMENSION)) {
    const items = itms[forma];
    if (items.length === 0) continue;

    const bruto = items.reduce((sum, i) => sum + (puntajes[i] ?? 0), 0);
    const factor = FACTORES_TRANSFORMACION_DIMENSION[dim][forma];
    const transformado = transformScore(bruto, factor);
    const baremos = BAREMOS_DIMENSIONES[dim][forma];
    const nivel = getRiskLevel(transformado, baremos);

    dimensiones[dim] = {
      nombre: dim,
      puntajeBruto: bruto,
      puntajeTransformado: transformado,
      nivelRiesgo: nivel,
      interpretacion: RISK_INTERPRETATIONS[nivel],
    };
  }

  // Paso 3: Puntajes brutos por dominio
  const DIMENSIONES_POR_DOMINIO_A = {
    liderazgo_relaciones: ['caracteristicas_liderazgo', 'relaciones_sociales', 'retroalimentacion_desempeno', 'relacion_colaboradores'],
    control: ['claridad_rol', 'capacitacion', 'participacion_cambio', 'oportunidades_habilidades', 'control_autonomia'],
    demandas: ['demandas_cuantitativas', 'demandas_carga_mental', 'demandas_emocionales', 'exigencias_responsabilidad', 'demandas_ambientales', 'demandas_jornada', 'influencia_extralaboral', 'consistencia_rol'],
    recompensas: ['recompensas_pertenencia', 'reconocimiento_compensacion'],
  };

  const DIMENSIONES_POR_DOMINIO_B = {
    liderazgo_relaciones: ['caracteristicas_liderazgo', 'relaciones_sociales', 'retroalimentacion_desempeno'],
    control: ['claridad_rol', 'capacitacion', 'participacion_cambio', 'oportunidades_habilidades', 'control_autonomia'],
    demandas: ['demandas_cuantitativas', 'demandas_carga_mental', 'demandas_emocionales', 'demandas_ambientales', 'demandas_jornada', 'influencia_extralaboral'],
    recompensas: ['recompensas_pertenencia', 'reconocimiento_compensacion'],
  };

  const dominiosDef = forma === 'A' ? DIMENSIONES_POR_DOMINIO_A : DIMENSIONES_POR_DOMINIO_B;
  const dominios: Record<string, DominioResult> = {};

  for (const [dom, dims] of Object.entries(dominiosDef)) {
    const bruto = dims.reduce((sum, d) => sum + (dimensiones[d]?.puntajeBruto ?? 0), 0);
    const factor = FACTORES_DOMINIO[dom][forma];
    const transformado = transformScore(bruto, factor);
    const nivel = getRiskLevel(transformado, BAREMOS_DOMINIOS[dom][forma]);

    dominios[dom] = {
      nombre: dom,
      puntajeBruto: bruto,
      puntajeTransformado: transformado,
      nivelRiesgo: nivel,
    };
  }

  // Paso 4: Total intralaboral
  const totalBruto = Object.values(dominios).reduce((s, d) => s + d.puntajeBruto, 0);
  const totalTransformado = transformScore(totalBruto, FACTOR_TOTAL[forma]);
  const nivelTotal = getRiskLevel(totalTransformado, BAREMOS_TOTAL[forma]);

  return {
    forma,
    dimensiones,
    dominios,
    totalIntralaboral: {
      bruto: totalBruto,
      transformado: totalTransformado,
      nivelRiesgo: nivelTotal,
    },
  };
}

// ─── Exportar constantes útiles ──────────────────────────────────────────────
export { FACTOR_TOTAL_GENERAL };
