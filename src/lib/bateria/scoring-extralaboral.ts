/**
 * Motor de Calificación: Cuestionario Extralaboral
 * Fuente: Ministerio de la Protección Social / Universidad Javeriana (2010)
 * Tablas 14, 15, 17 y 18 del manual oficial
 */

export type NivelRiesgo = 'sin_riesgo' | 'bajo' | 'medio' | 'alto' | 'muy_alto';

export interface ResultadoDimension {
  dimension: string;
  puntajeBruto: number;
  factorTransformacion: number;
  puntajeTransformado: number;
  nivelRiesgo: NivelRiesgo;
}

export interface ResultadoExtralaboral {
  dimensiones: ResultadoDimension[];
  puntajeBrutoTotal: number;
  puntajeTransformadoTotal: number;
  nivelRiesgoTotal: NivelRiesgo;
  grupoOcupacional: 'jefatura_profesional' | 'auxiliar_operario';
}

// ─── Tabla 14: Factores de transformación extralaboral ────────────────────────
// Factor = puntaje máximo posible de cada dimensión (4 × n_ítems)

const FACTORES_EXTRA: Record<string, number> = {
  tiempo_fuera: 16,            // 4 ítems × 4
  relaciones_familiares: 12,   // 3 ítems × 4
  comunicacion_relaciones: 20, // 5 ítems × 4
  situacion_economica: 12,     // 3 ítems × 4
  vivienda_entorno: 36,        // 9 ítems × 4
  influencia_extralaboral: 12, // 3 ítems × 4
  desplazamiento: 16,          // 4 ítems × 4
};

const FACTOR_TOTAL_EXTRA = 124; // suma de todos

// ─── Ítems por dimensión extralaboral ─────────────────────────────────────────
// (números de ítem del cuestionario extralaboral, 1–31)

const ITEMS_POR_DIMENSION: Record<string, number[]> = {
  tiempo_fuera:           [1, 2, 3, 4],
  relaciones_familiares:  [5, 6, 7],
  comunicacion_relaciones:[8, 9, 10, 11, 12],
  situacion_economica:    [13, 14, 15],
  vivienda_entorno:       [16, 17, 18, 19, 20, 21, 22, 23, 24],
  influencia_extralaboral:[25, 26, 27],
  desplazamiento:         [28, 29, 30, 31],
};

// Ítems que tienen puntuación INVERTIDA (responder "Nunca" = mayor riesgo)
// Para extralaboral, los ítems positivos se invierten
const INVERTIDOS_EXTRA = new Set([
  1, 2, 3, 4,          // tiempo fuera: más tiempo libre = menor riesgo
  5, 6,                // relaciones familiares positivas
  8, 9, 10, 11, 12,    // comunicación / apoyo
  13, 14, 15,          // situación económica positiva
  16, 17, 18, 19, 20,  // vivienda adecuada
  22, 23, 24,          // vivienda entorno positivo
  28, 29, 30, 31,      // desplazamiento cómodo
]);

// Ítem 7: discusiones en casa → dirección normal (más = más riesgo)
// Ítem 21: ruido en vivienda → dirección normal
// Ítems 25, 26, 27: influencia negativa → dirección normal

const VALOR_OPCION: Record<string, number> = {
  siempre: 4, casi_siempre: 3, algunas_veces: 2, casi_nunca: 1, nunca: 0
};

function getValor(item: number, respuesta: string): number {
  const v = VALOR_OPCION[respuesta] ?? 0;
  return INVERTIDOS_EXTRA.has(item) ? 4 - v : v;
}

// ─── Tabla 17 y 18: Baremos extralaboral ─────────────────────────────────────

type BaremoEntry = { sinRiesgo: [number, number]; bajo: [number, number]; medio: [number, number]; alto: [number, number]; muyAlto: [number, number] };

const BAREMOS_JEFATURA: Record<string, BaremoEntry> = {
  tiempo_fuera:            { sinRiesgo:[0,6.3], bajo:[6.4,25],   medio:[25.1,37.5], alto:[37.6,50],   muyAlto:[50.1,100] },
  relaciones_familiares:   { sinRiesgo:[0,8.3], bajo:[8.4,25],   medio:[25.1,33.3], alto:[33.4,50],   muyAlto:[50.1,100] },
  comunicacion_relaciones: { sinRiesgo:[0,0.9], bajo:[1,10],     medio:[10.1,20],   alto:[20.1,30],   muyAlto:[30.1,100] },
  situacion_economica:     { sinRiesgo:[0,8.3], bajo:[8.4,25],   medio:[25.1,33.3], alto:[33.4,50],   muyAlto:[50.1,100] },
  vivienda_entorno:        { sinRiesgo:[0,5.6], bajo:[5.7,11.1], medio:[11.2,13.9], alto:[14,22.2],   muyAlto:[22.3,100] },
  influencia_extralaboral: { sinRiesgo:[0,8.3], bajo:[8.4,16.7], medio:[16.8,25],   alto:[25.1,41.7], muyAlto:[41.8,100] },
  desplazamiento:          { sinRiesgo:[0,0.9], bajo:[1,12.5],   medio:[12.6,25],   alto:[25.1,43.8], muyAlto:[43.9,100] },
  _total:                  { sinRiesgo:[0,11.3], bajo:[11.4,16.9], medio:[17,22.6], alto:[22.7,29],   muyAlto:[29.1,100] },
};

const BAREMOS_AUXILIAR: Record<string, BaremoEntry> = {
  tiempo_fuera:            { sinRiesgo:[0,6.3], bajo:[6.4,25],   medio:[25.1,37.5], alto:[37.6,50],   muyAlto:[50.1,100] },
  relaciones_familiares:   { sinRiesgo:[0,8.3], bajo:[8.4,25],   medio:[25.1,33.3], alto:[33.4,50],   muyAlto:[50.1,100] },
  comunicacion_relaciones: { sinRiesgo:[0,5],   bajo:[5.1,15],   medio:[15.1,25],   alto:[25.1,35],   muyAlto:[35.1,100] },
  situacion_economica:     { sinRiesgo:[0,16.7],bajo:[16.8,25],  medio:[25.1,41.7], alto:[41.8,50],   muyAlto:[50.1,100] },
  vivienda_entorno:        { sinRiesgo:[0,5.6], bajo:[5.7,11.1], medio:[11.2,16.7], alto:[16.8,27.8], muyAlto:[27.9,100] },
  influencia_extralaboral: { sinRiesgo:[0,0.9], bajo:[1,16.7],   medio:[16.8,25],   alto:[25.1,41.7], muyAlto:[41.8,100] },
  desplazamiento:          { sinRiesgo:[0,0.9], bajo:[1,12.5],   medio:[12.6,25],   alto:[25.1,43.8], muyAlto:[43.9,100] },
  _total:                  { sinRiesgo:[0,11.3], bajo:[11.4,16.9], medio:[17,22.6], alto:[22.7,29],   muyAlto:[29.1,100] },
};

function clasificarRiesgo(puntaje: number, baremo: BaremoEntry): NivelRiesgo {
  if (puntaje <= baremo.sinRiesgo[1]) return 'sin_riesgo';
  if (puntaje <= baremo.bajo[1])      return 'bajo';
  if (puntaje <= baremo.medio[1])     return 'medio';
  if (puntaje <= baremo.alto[1])      return 'alto';
  return 'muy_alto';
}

// ─── Función principal ────────────────────────────────────────────────────────

export function calcularExtralaboral(
  respuestas: Record<string, string>,
  tipoCargo: string
): ResultadoExtralaboral {
  const esJefaturaProfesional = ['jefatura', 'profesional', 'tecnico'].includes(tipoCargo);
  const baremos = esJefaturaProfesional ? BAREMOS_JEFATURA : BAREMOS_AUXILIAR;

  const dimensiones: ResultadoDimension[] = [];
  let brutoTotal = 0;

  for (const [dimId, items] of Object.entries(ITEMS_POR_DIMENSION)) {
    let bruto = 0;
    for (const item of items) {
      const resp = respuestas[String(item)] ?? 'nunca';
      bruto += getValor(item, resp);
    }
    const factor = FACTORES_EXTRA[dimId];
    const transformado = parseFloat(((bruto / factor) * 100).toFixed(1));
    const nivel = clasificarRiesgo(transformado, baremos[dimId]);
    brutoTotal += bruto;

    dimensiones.push({
      dimension: dimId,
      puntajeBruto: bruto,
      factorTransformacion: factor,
      puntajeTransformado: transformado,
      nivelRiesgo: nivel,
    });
  }

  const transformadoTotal = parseFloat(((brutoTotal / FACTOR_TOTAL_EXTRA) * 100).toFixed(1));
  const nivelTotal = clasificarRiesgo(transformadoTotal, baremos['_total']);

  return {
    dimensiones,
    puntajeBrutoTotal: brutoTotal,
    puntajeTransformadoTotal: transformadoTotal,
    nivelRiesgoTotal: nivelTotal,
    grupoOcupacional: esJefaturaProfesional ? 'jefatura_profesional' : 'auxiliar_operario',
  };
}

// ─── Nombres legibles de dimensiones ─────────────────────────────────────────

export const NOMBRES_DIMENSION_EXTRA: Record<string, string> = {
  tiempo_fuera:            'Tiempo fuera del trabajo',
  relaciones_familiares:   'Relaciones familiares',
  comunicacion_relaciones: 'Comunicación y relaciones interpersonales',
  situacion_economica:     'Situación económica del grupo familiar',
  vivienda_entorno:        'Características de la vivienda y su entorno',
  influencia_extralaboral: 'Influencia del entorno extralaboral sobre el trabajo',
  desplazamiento:          'Desplazamiento vivienda–trabajo–vivienda',
};
