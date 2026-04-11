/**
 * DATOS SEMILLA — 3 Empleados de Prueba
 * Psicolab SaaS — Batería de Riesgo Psicosocial Colombia
 *
 * Perfiles:
 *  1. Andrea Gómez     — Jefatura (Forma A) — Riesgo ALTO (burnout ejecutivo)
 *  2. Juan Martínez    — Técnico  (Forma A) — Riesgo MEDIO (equilibrio razonable)
 *  3. Rosa Perdomo     — Operaria (Forma B) — Riesgo MUY ALTO (condiciones precarias)
 *
 * Escala Intralaboral/Extralaboral: 0=Siempre, 1=Casi siempre, 2=A veces, 3=Casi nunca, 4=Nunca
 * Escala Estrés: siempre=3, casi_siempre=2, algunas_veces=1, nunca=0
 *
 * NOTA: Para ítems INVERTIDOS (listados en scoring-intralaboral.ts), una respuesta 0 (Siempre)
 * se convierte en puntaje 4 (máximo riesgo) y viceversa.
 * Para ítems NO invertidos, 0 (Siempre) = puntaje 0 (sin riesgo), 4 (Nunca) = puntaje 4 (máximo riesgo).
 *
 * Convenio usado aquí: los valores que se guardan son la RESPUESTA CRUDA (0–4),
 * igual que como el usuario la selecciona en el formulario.
 * El motor de scoring se encarga de invertir/no invertir.
 */

// ─── Tipos locales (reflejo de los del scoring engine) ────────────────────────

export type RespuestaIntra  = Record<number, 0 | 1 | 2 | 3 | 4>;
export type RespuestaExtra  = Record<string, string>; // "1" → "siempre"|"casi_siempre"|etc
export type RespuestaEstres = Record<string, string>; // "1" → "siempre"|"casi_siempre"|"algunas_veces"|"nunca"

export interface EmpleadoSemilla {
  /** Datos personales */
  nombre: string;
  cargo: string;
  area: string;
  tipoCargo: 'jefatura' | 'profesional' | 'tecnico' | 'auxiliar' | 'operario';
  forma: 'A' | 'B';

  /** Flags de condición */
  esJefeDePersonas: boolean;
  tieneClientesUsuarios: boolean;
  esMandoSinJefe: boolean;

  /** Respuestas crudas (0–4) para Cuestionario Intralaboral */
  respuestasIntra: RespuestaIntra;

  /** Respuestas Extralaboral  */
  respuestasExtra: RespuestaExtra;

  /** Respuestas Estrés */
  respuestasEstres: RespuestaEstres;

  /** Resultado esperado aproximado (para referencia visual del tester) */
  nivelEsperado: {
    intralaboral: string;
    extralaboral: string;
    estres: string;
  };
}

// ════════════════════════════════════════════════════════════════════════════════
// EMPLEADO 1 — Andrea Gómez, Directora de Operaciones
// Perfil: Jefatura bajo mucha presión. Alta carga mental, pocas recompensas,
//         conflicto trabajo–familia. → RIESGO ALTO Intralaboral, MEDIO Extralaboral
// ════════════════════════════════════════════════════════════════════════════════

/**
 * LÓGICA DE RESPUESTAS ANDREA (Forma A):
 * Ítems INVERTIDOS Forma A (marcar bajo = alto riesgo):
 *   1,2,3,7,8,10,11,13,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,33,35,36,37,38,52,80,
 *   106–123 (todos).
 * → Para generar RIESGO ALTO: en ítems invertidos usar respuesta 4 (Nunca = puntaje 0).
 *   En ítems NO invertidos usar respuesta 0 (Siempre = puntaje 4).
 *
 * Escenario: Andrea trabaja muchas horas (ítem 13=0 siempre), siente que el trabajo
 *   interfiere con su familia (35,36,37,38=0), pocas recompensas (96–105 = respuestas bajas),
 *   but tiene buen liderazgo recibido (63-75 bien puntuados).
 */
const andrea_intra: RespuestaIntra = {
  // ── Demandas ambientales (1–12) ──────────────────────────────────────────
  // Ítems 1,2,3,7,8,10,11 son INVERTIDOS → respuesta 3 (Casi nunca) = puntaje moderado
  // Ítems 4,5,6,9,12 NO invertidos → respuesta 1 (Casi siempre) = riesgo moderado
  1:  3, // ruido molesto → casi nunca (puntaje 1, bajo)
  2:  3, // mucho frío → casi nunca (bajo)
  3:  3, // mucho calor → casi nunca (bajo)
  4:  1, // aire fresco [NO inv] → casi siempre (puntaje 3, moderado)
  5:  1, // luz agradable [NO inv] → casi siempre (moderado)
  6:  1, // espacio cómodo [NO inv] → casi siempre (moderado)
  7:  2, // exposición química [INV] → a veces (puntaje 2)
  8:  1, // esfuerzo físico [INV] → casi siempre (puntaje 3)
  9:  1, // equipos cómodos [NO inv] → casi siempre (moderado)
  10: 2, // microbios [INV] → a veces (puntaje 2)
  11: 2, // accidentarse [INV] → a veces (puntaje 2)
  12: 0, // limpio y ordenado [NO inv] → siempre (puntaje 4 riesgo alto)

  // ── Demandas cuantitativas (13,14,15,32,43,47) ──────────────────────────
  // 13=INV,15=INV → usar 0 (puntaje 4 = mucho riesgo). 14=NO inv → usar 4 (riesgo alto)
  13: 0, // quedarme tiempo extra [INV] → siempre (puntaje 4, ALTO RIESGO)
  14: 4, // me alcanza el tiempo [NO inv] → nunca (puntaje 4, ALTO RIESGO)
  15: 0, // trabajar sin parar [INV] → siempre (puntaje 4, ALTO RIESGO)
  32: 4, // exigen actualiz continua [NO inv] → nunca raro, puntaje 4
  43: 4, // exigen más de lo que puedo [NO inv] → nunca = puntaje 4 (inconsistente pero para riesgo)
  47: 4, // pagan según trabajo [NO inv] → nunca (puntaje 4 riesgo compensación)

  // ── Carga mental (16,17,18,20,21) — todos INVERTIDOS → bajas respuestas = alto riesgo ──
  16: 0, // esfuerzo mental [INV] → siempre (puntaje 4)
  17: 0, // muy concentrado [INV] → siempre (puntaje 4)
  18: 1, // memorizar info [INV] → casi siempre (puntaje 3)
  20: 0, // pequeños detalles [INV] → siempre (puntaje 4)
  21: 0, // decisiones difíciles rápido [INV] → siempre (puntaje 4)

  // ── Exigencias responsabilidad (19,22,23,24,25,26) — todos INVERTIDOS ───
  19: 0, // cálculos matemáticos [INV] → siempre (puntaje 4)
  22: 0, // muchos asuntos a la vez [INV] → siempre (puntaje 4)
  23: 1, // contra mis principios [INV] → casi siempre (puntaje 3)
  24: 0, // responsable de cosas importantes [INV] → siempre (puntaje 4)
  25: 1, // sin información completa [INV] → casi siempre (puntaje 3)
  26: 2, // cuidar vida/salud [INV] → a veces (puntaje 2)

  // ── Consistencia rol (27,28,29,30,52) — 27,28,29,30 INVERTIDOS, 52 INVERTIDO ──
  27: 0, // tareas en poco tiempo [INV] → siempre (puntaje 4)
  28: 0, // cosas distintas a la vez [INV] → siempre (puntaje 4)
  29: 1, // piden cosas distintas [INV] → casi siempre (puntaje 3)
  30: 1, // tareas cambian sin aviso [INV] → casi siempre (puntaje 3)
  52: 1, // me indican importancia [INV] → casi siempre (puntaje 3)

  // ── Demandas jornada (31,33,34) — 31 NO inv, 33 NO inv, 34 NO inv ───────
  31: 0, // horario nocturno [NO inv] → siempre (puntaje 4 riesgo jornada)
  33: 4, // pausas para descansar [NO inv] → nunca (puntaje 4, sin pausas = alto riesgo)
  34: 0, // laborar festivos [NO inv] → siempre (puntaje 4)

  // ── Influencia extralaboral (35,36,37,38) — todos INVERTIDOS → bajo = alto riesgo ──
  35: 0, // pienso en trabajo en casa [INV] → siempre (puntaje 4)
  36: 0, // discuto por causa trabajo [INV] → siempre (puntaje 4)
  37: 0, // atiendo trabajo en casa [INV] → siempre (puntaje 4)
  38: 0, // poco tiempo familia [INV] → siempre (puntaje 4)

  // ── Habilidades/Oportunidades (39,40,41,42) — todos INVERTIDOS ──────────
  39: 1, // hacer cosas nuevas [INV] → casi siempre (puntaje 3)
  40: 1, // desarrollar habilidades [INV] → casi siempre (puntaje 3)
  41: 1, // aplicar conocimientos [INV] → casi siempre (puntaje 3)
  42: 1, // aprender cosas nuevas [INV] → casi siempre (puntaje 3)

  // ── Control autonomía (44,45,46) — NO invertidos ─────────────────────────
  44: 3, // pausas cuando necesito [NO inv] → casi nunca (puntaje 3, moderado)
  45: 3, // decidir cuánto trabajo [NO inv] → casi nunca (puntaje 3)
  46: 3, // decidir velocidad [NO inv] → casi nunca (puntaje 3)

  // ── Participación en cambio (48,49,50,51) — todos INVERTIDOS ─────────────
  48: 1, // explican cambios [INV] → casi siempre (puntaje 3)
  49: 2, // puedo dar sugerencias [INV] → a veces (puntaje 2)
  50: 2, // tienen en cuenta ideas [INV] → a veces (puntaje 2)
  51: 2, // informan con anticipación [INV] → a veces (puntaje 2)

  // ── Claridad rol (53–59) — todos INVERTIDOS ──────────────────────────────
  53: 0, // informan funciones [INV] → siempre (puntaje 4)
  54: 1, // informan decisiones [INV] → casi siempre (puntaje 3)
  55: 0, // explican resultados [INV] → siempre (puntaje 4)
  56: 0, // explican objetivos [INV] → siempre (puntaje 4)
  57: 1, // con quién resolver [INV] → casi siempre (puntaje 3)
  58: 0, // quién es jefe [INV] → siempre (puntaje 4)
  59: 0, // responsabilidades [INV] → siempre (puntaje 4)

  // ── Capacitación (60,61,62) — todos INVERTIDOS ───────────────────────────
  60: 1, // asistir a capacitaciones [INV] → casi siempre (puntaje 3)
  61: 2, // capacitación útil [INV] → a veces (puntaje 2)
  62: 2, // capacitación ayuda [INV] → a veces (puntaje 2)

  // ── Características liderazgo (63–75) — todos INVERTIDOS ─────────────────
  63: 1, // jefe instrucciones claras [INV] → casi siempre (puntaje 3)
  64: 2, // jefe organiza trabajo [INV] → a veces (puntaje 2)
  65: 2, // jefe puntos de vista [INV] → a veces (puntaje 2)
  66: 1, // jefe anima [INV] → casi siempre (puntaje 3)
  67: 2, // jefe distribuye tareas [INV] → a veces (puntaje 2)
  68: 2, // jefe comunica a tiempo [INV] → a veces (puntaje 2)
  69: 2, // orientación jefe [INV] → a veces (puntaje 2)
  70: 2, // jefe ayuda a progresar [INV] → a veces (puntaje 2)
  71: 2, // jefe bienestar [INV] → a veces (puntaje 2)
  72: 2, // jefe soluciona problemas [INV] → a veces (puntaje 2)
  73: 2, // confiar en jefe [INV] → a veces (puntaje 2)
  74: 3, // jefe escucha [INV] → casi nunca (puntaje 1)
  75: 3, // jefe apoyo [INV] → casi nunca (puntaje 1)

  // ── Relaciones sociales (76–89) — solo 80 INVERTIDO ─────────────────────
  76: 0, // me agrada ambiente [INV] → siempre (puntaje 4)
  77: 0, // tratan respetuosamente [INV] → siempre (puntaje 4)
  78: 0, // confío en compañeros [INV] → siempre (puntaje 4)
  79: 0, // a gusto con compañeros [INV] → siempre (puntaje 4)
  80: 4, // me maltratan en grupo [NO inv] → nunca (puntaje 4, sin maltrato = sin riesgo)
  81: 0, // resolvemos respetuosamente [INV] → siempre (puntaje 4)
  82: 0, // hay integración [INV] → siempre (puntaje 4)
  83: 1, // grupo unido [INV] → casi siempre (puntaje 3)
  84: 0, // me hacen sentir parte [INV] → siempre (puntaje 4)
  85: 0, // colaboran en grupo [INV] → siempre (puntaje 4)
  86: 1, // fácil poner de acuerdo [INV] → casi siempre (puntaje 3)
  87: 0, // compañeros me ayudan [INV] → siempre (puntaje 4)
  88: 0, // nos apoyamos [INV] → siempre (puntaje 4)
  89: 0, // compañeros escuchan [INV] → siempre (puntaje 4)

  // ── Retroalimentación (90–94) — todos INVERTIDOS ─────────────────────────
  90: 2, // informan lo que hago bien [INV] → a veces (puntaje 2)
  91: 2, // informan mejoras [INV] → a veces (puntaje 2)
  92: 2, // information clara rendimiento [INV] → a veces (puntaje 2)
  93: 2, // evaluación ayuda [INV] → a veces (puntaje 2)
  94: 3, // informan a tiempo [INV] → casi nunca (puntaje 1)

  // ── Recompensas (95–105) — todos INVERTIDOS ──────────────────────────────
  95:  1, // confían en mi trabajo [INV] → casi siempre (puntaje 3)
  96:  0, // pagan a tiempo [INV] → siempre (puntaje 4) ← pago puntual
  97:  1, // pago ofrecido [INV] → casi siempre (puntaje 3)
  98:  3, // pago merecido [INV] → casi nunca (puntaje 1)  ← insatisfecho
  99:  3, // posibilidades progresar [INV] → casi nunca (puntaje 1) ← pocas oportunidades
  100: 3, // los buenos progresan [INV] → casi nunca (puntaje 1)
  101: 3, // empresa bienestar [INV] → casi nunca (puntaje 1) ← alta insatisfacción
  102: 1, // trabajo estable [INV] → casi siempre (puntaje 3)
  103: 2, // trabajo me hace sentir bien [INV] → a veces (puntaje 2)
  104: 2, // orgullo empresa [INV] → a veces (puntaje 2)
  105: 1, // hablo bien empresa [INV] → casi siempre (puntaje 3)

  // ── Demandas emocionales (106–114) — todos INVERTIDOS ────────────────────
  106: 0, // clientes enojados [INV] → siempre (puntaje 4)
  107: 0, // clientes preocupados [INV] → siempre (puntaje 4)
  108: 1, // clientes tristes [INV] → casi siempre (puntaje 3)
  109: 2, // personas enfermas [INV] → a veces (puntaje 2)
  110: 1, // necesitadas de ayuda [INV] → casi siempre (puntaje 3)
  111: 2, // me maltratan clientes [INV] → a veces (puntaje 2)
  112: 1, // demostrar sentimientos distintos [INV] → casi siempre (puntaje 3)
  113: 2, // situaciones de violencia [INV] → a veces (puntaje 2)
  114: 1, // situaciones muy tristes [INV] → casi siempre (puntaje 3)

  // ── Relación con colaboradores (115–123) — todos INVERTIDOS (Forma A) ────
  // Andrea SÍ es jefe → estos se evalúan
  115: 2, // comunican tarde [INV] → a veces (puntaje 2)
  116: 3, // comportamientos irrespetuosos [INV] → casi nunca (puntaje 1)
  117: 2, // dificultan organización [INV] → a veces (puntaje 2)
  118: 2, // guardan silencio [INV] → a veces (puntaje 2)
  119: 2, // dificultan logro [INV] → a veces (puntaje 2)
  120: 3, // irrespetuosos en desacuerdo [INV] → casi nunca (puntaje 1)
  121: 2, // cooperan poco [INV] → a veces (puntaje 2)
  122: 2, // preocupan desempeño [INV] → a veces (puntaje 2)
  123: 2, // ignoran sugerencias [INV] → a veces (puntaje 2)
};

const andrea_extra: RespuestaExtra = {
  // Dimensión: tiempo_fuera (ítems 1–4, INVERTIDOS → siempre = 0 = sin tiempo = riesgo)
  '1':  'casi_nunca',    // después del trabajo tengo tiempo para descansar → casi nunca (riesgo)
  '2':  'casi_nunca',    // actividades de descanso → casi nunca
  '3':  'nunca',         // recreación → nunca (ALTO riesgo)
  '4':  'casi_nunca',    // compartir familia/amigos → casi nunca

  // relaciones_familiares (5,6 INV, 7 NO INV)
  '5':  'siempre',       // relaciones familiares buenas [INV] → siempre (puntaje 0 = sin riesgo)
  '6':  'siempre',       // relación pareja buena [INV] → siempre (sin riesgo)
  '7':  'algunas_veces', // discusiones en casa [NO INV] → a veces (riesgo moderado)

  // comunicacion_relaciones (8–12, todos INV)
  '8':  'siempre',    // buenas relaciones comunidad → siempre
  '9':  'siempre',    // amigos con quienes hablar → siempre
  '10': 'casi_siempre', // apoyo social → casi siempre
  '11': 'siempre',    // amigos apoyan → siempre
  '12': 'casi_siempre', // acudo cuando tengo dificultades → casi siempre

  // situacion_economica (13–15, INV)
  '13': 'casi_siempre',  // gastos acordes ingresos → casi siempre
  '14': 'siempre',       // ingresos para necesidades → siempre
  '15': 'casi_nunca',    // para gastos extras → casi nunca (algo de presión)

  // vivienda_entorno (16–24, 21 NO INV, resto INV)
  '16': 'siempre',       // vivienda adecuada → siempre
  '17': 'siempre',       // vías y transporte → siempre
  '18': 'siempre',       // zona segura → siempre
  '19': 'siempre',       // acceso salud → siempre
  '20': 'siempre',       // acceso educación → siempre
  '21': 'casi_nunca',    // ruido o polución [NO INV] → casi nunca (bajo riesgo)
  '22': 'siempre',       // zona tranquila [INV] → siempre
  '23': 'casi_siempre',  // recrearse en residencia [INV] → casi siempre
  '24': 'siempre',       // parques/zonas verdes [INV] →siempre

  // influencia_extralaboral (25–27, NO INV)
  '25': 'siempre',       // vida fuera dificulta concentración → siempre (ALTO riesgo)
  '26': 'siempre',       // problemas fuera me afectan → siempre (ALTO riesgo)
  '27': 'casi_siempre',  // responsabilidades quitan energía → casi siempre (riesgo)

  // desplazamiento (28–31, INV)
  '28': 'casi_siempre',  // tiempo desplazamiento cómodo → casi siempre
  '29': 'siempre',       // transporte cómodo → siempre
  '30': 'casi_siempre',  // transporte público bueno → casi siempre
  '31': 'casi_nunca',    // tiempo desplazamiento para otras actividades → casi nunca
};

const andrea_estres: RespuestaEstres = {
  // Síntomas fisiológicos (1–8)
  '1':  'casi_siempre',  // dolor de cabeza
  '2':  'algunas_veces', // problemas gastrointestinales
  '3':  'nunca',         // problemas respiratorios
  '4':  'casi_siempre',  // dolor de espalda
  '5':  'siempre',       // alteraciones sueño (desvelo)
  '6':  'algunas_veces', // palpitaciones
  '7':  'algunas_veces', // cambios apetito
  '8':  'nunca',         // prob órganos sentidos

  // Comportamiento social (9–12)
  '9':  'algunas_veces', // aislamiento
  '10': 'algunas_veces', // dificultad relaciones familiares
  '11': 'nunca',         // dificultad para quedarse quieto
  '12': 'nunca',         // dificultad con otras personas

  // Intelectuales/laborales (13–22)
  '13': 'siempre',       // sobrecarga de trabajo
  '14': 'casi_siempre',  // dificultad concentración
  '15': 'nunca',         // accidentes laborales
  '16': 'algunas_veces', // frustración
  '17': 'casi_siempre',  // cansancio/tedio
  '18': 'algunas_veces', // disminución rendimiento
  '19': 'algunas_veces', // deseo no asistir al trabajo
  '20': 'nunca',         // bajo compromiso
  '21': 'algunas_veces', // dificultad decisiones
  '22': 'algunas_veces', // deseo cambiar empleo
};

const juan_intra: RespuestaIntra = {
  // Demandas ambientales (1–12)
  // INV: 1,2,3,7,8,10,11 → resp alto (3-4) = puntaje bajo = sin riesgo ambiental (oficina limpia)
  // NO inv: 4,5,6,9,12 → resp=4 → score=4-4=0 = sin riesgo
  1:  4, // ruido [INV] → nunca (puntaje 0, no hay ruido)
  2:  4, // frío [INV] → nunca (puntaje 0)
  3:  4, // calor [INV] → nunca (puntaje 0)
  4:  4, // aire fresco [NO inv] → resp=4 → score=0 (hay buen aire)
  5:  4, // luz agradable [NO inv] → resp=4 → score=0 (buena luz)
  6:  4, // espacio cómodo [NO inv] → resp=4 → score=0
  7:  4, // químicos [INV] → nunca (puntaje 0)
  8:  4, // esfuerzo físico [INV] → nunca (trabajo de oficina)
  9:  4, // equipos cómodos [NO inv] → resp=4 → score=0 (equipos buenos)
  10: 4, // microbios [INV] → nunca (puntaje 0)
  11: 3, // accidentarse [INV] → casi nunca (puntaje 1)
  12: 4, // limpio [NO inv] → resp=4 → score=0 (limpio)

  // Demandas cuantitativas (13,14,15,32,43,47) — algo de carga
  // 13=INV, 15=INV → resp=2 = puntaje 2 (riesgo moderado)
  // NO inv: resp=2 → score=4-2=2
  13: 2, // tiempo extra [INV] → a veces (puntaje 2)
  14: 2, // me alcanza el tiempo [NO inv] → resp=2 → score=2
  15: 2, // trabajar sin parar [INV] → a veces (puntaje 2)
  32: 2, // actualización continua [NO inv] → resp=2 → score=2
  43: 3, // exigen más de lo posible [NO inv] → resp=3 → score=1 (poca presión)
  47: 2, // pagan según trabajo [NO inv] → resp=2 → score=2

  // Carga mental (16,17,18,20,21) — trabajo técnico: alta concentración
  // INV → resp=1 = puntaje 3 (moderado-alto, es técnico)
  16: 1, // esfuerzo mental [INV] → casi siempre (puntaje 3)
  17: 1, // concentración [INV] → casi siempre (puntaje 3)
  18: 2, // memorizar [INV] → a veces (puntaje 2)
  20: 1, // detalles [INV] → casi siempre (puntaje 3)
  21: 3, // decisiones difíciles [INV] → casi nunca (puntaje 1)

  // Exigencias responsabilidad (19,22,23,24,25,26) — todos INV
  19: 3, // cálculos [INV] → casi nunca (puntaje 1)
  22: 2, // muchos asuntos [INV] → a veces (puntaje 2)
  23: 4, // contra principios [INV] → nunca (puntaje 0)
  24: 2, // responsable cosas import [INV] → a veces (puntaje 2)
  25: 2, // sin info completa [INV] → a veces (puntaje 2)
  26: 4, // cuidar vida [INV] → nunca (puntaje 0)

  // Consistencia rol (27,28,29,30,52) — todos INV
  27: 2, // tareas en poco tiempo [INV] → a veces (puntaje 2)
  28: 2, // cosas distintas [INV] → a veces (puntaje 2)
  29: 3, // piden cosas distintas [INV] → casi nunca (puntaje 1)
  30: 3, // cambian sin avisar [INV] → casi nunca (puntaje 1)
  52: 1, // me indican importancia [INV] → casi siempre (puntaje 3)

  // Demandas jornada (31,33,34) — NO invertidos. Para SIN riesgo: resp=4 → score=0
  31: 4, // noche [NO inv] → resp=4 → score=0, no trabaja de noche
  33: 4, // pausas [NO inv] → resp=4 → score=0 (puede tomar pausas)
  34: 2, // festivos [NO inv] → resp=2 → score=2 (a veces trabaja festivos)

  // Influencia extralaboral (35,36,37,38) — todos INV. Algo de interferencia: resp=2-3
  35: 2, // piensa en trabajo en casa [INV] → a veces (puntaje 2)
  36: 4, // discute por trabajo [INV] → nunca (puntaje 0)
  37: 3, // atiende trabajo en casa [INV] → casi nunca (puntaje 1)
  38: 2, // poco tiempo familia [INV] → a veces (puntaje 2)

  // Habilidades (39,40,41,42) — todos INV. Buen desarrollo: resp=0 (puntaje 4, sin riesgo)
  39: 0, // cosas nuevas [INV] → siempre (puntaje 4)
  40: 0, // desarrollar habilidades [INV] → siempre (puntaje 4)
  41: 0, // aplicar conocimientos [INV] → siempre (puntaje 4)
  42: 0, // aprender [INV] → siempre (puntaje 4)

  // Control autonomía (44,45,46) — NO inv. Para riesgo moderado: resp=2 → score=2
  44: 2, // pausas cuando necesito [NO inv] → resp=2 → score=2
  45: 2, // decidir cuánto trabajo [NO inv] → resp=2 → score=2
  46: 2, // decidir velocidad [NO inv] → resp=2 → score=2

  // Participación cambio (48,49,50,51) — todos INV. Regular
  48: 1, // explican cambios [INV] → casi siempre (puntaje 3)
  49: 1, // sugerencias [INV] → casi siempre (puntaje 3)
  50: 2, // tienen en cuenta ideas [INV] → a veces (puntaje 2)
  51: 1, // informan anticipación [INV] → casi siempre (puntaje 3)

  // Claridad rol (53–59, INV)
  53: 0, // funciones [INV] → siempre (puntaje 4)
  54: 0, // decisiones [INV] → siempre
  55: 0, // resultados [INV] → siempre
  56: 0, // objetivos [INV] → siempre
  57: 0, // con quién resolver [INV] → siempre
  58: 0, // jefe [INV] → siempre
  59: 0, // responsabilidades [INV] → siempre

  // Capacitación (60–62, INV)
  60: 1, // asistir cap [INV] → casi siempre (puntaje 3)
  61: 1, // cap útil [INV] → casi siempre
  62: 1, // cap ayuda [INV] → casi siempre

  // Liderazgo (63–75, INV)
  63: 0, [64]: 0, [65]: 1, [66]: 0, [67]: 0, [68]: 0, [69]: 0,
  70: 1, [71]: 0, [72]: 0, [73]: 0, [74]: 0, [75]: 0,

  // Relaciones sociales (76–89)
  76: 0, 77: 0, 78: 0, 79: 0,
  80: 4, // me maltratan [NO inv] → nunca (puntaje 0 riesgo, buen ambiente)
  81: 0, 82: 0, 83: 0, 84: 0, 85: 0, 86: 0, 87: 0, 88: 0, 89: 0,

  // Retroalimentación (90–94, INV)
  90: 1, 91: 1, 92: 1, 93: 2, 94: 2,

  // Recompensas (95–105, INV)
  95:  0, // confían trabajo → siempre
  96:  0, // pagan a tiempo → siempre
  97:  0, // pago ofrecido → siempre
  98:  2, // pago merecido → a veces
  99:  1, // progresar → casi siempre
  100: 1,
  101: 1,
  102: 0, // estable → siempre
  103: 0, // me hace sentir bien → siempre
  104: 0, // orgullo → siempre
  105: 0,

  // Demandas emocionales (106–114, INV) → Juan sí atiende clientes
  106: 3, 107: 2, 108: 3, 109: 4, 110: 3,
  111: 4, 112: 3, 113: 4, 114: 3,

  // Relación colaboradores (115–123, INV) → Juan NO es jefe → scores = 0 (el motor los ignora)
  115: 4, 116: 4, 117: 4, 118: 4, 119: 4,
  120: 4, 121: 4, 122: 4, 123: 4,
};

const juan_extra: RespuestaExtra = {
  '1': 'casi_siempre', '2': 'siempre',    '3': 'casi_siempre', '4': 'siempre',
  '5': 'siempre',      '6': 'siempre',    '7': 'nunca',
  '8': 'siempre',      '9': 'siempre',    '10': 'siempre',    '11': 'siempre', '12': 'siempre',
  '13': 'siempre',     '14': 'siempre',   '15': 'casi_siempre',
  '16': 'siempre',     '17': 'siempre',   '18': 'siempre',    '19': 'siempre', '20': 'siempre',
  '21': 'nunca',       '22': 'siempre',   '23': 'siempre',    '24': 'siempre',
  '25': 'nunca',       '26': 'nunca',     '27': 'casi_nunca',
  '28': 'siempre',     '29': 'siempre',   '30': 'casi_siempre', '31': 'casi_siempre',
};

const juan_estres: RespuestaEstres = {
  '1':  'algunas_veces', '2': 'nunca',         '3': 'nunca',        '4': 'algunas_veces',
  '5':  'casi_nunca',    '6': 'nunca',          '7': 'nunca',        '8': 'nunca',
  '9':  'nunca',         '10': 'nunca',         '11': 'nunca',       '12': 'nunca',
  '13': 'algunas_veces', '14': 'algunas_veces', '15': 'nunca',       '16': 'nunca',
  '17': 'algunas_veces', '18': 'nunca',         '19': 'nunca',       '20': 'nunca',
  '21': 'nunca',         '22': 'nunca',
  '23': 'nunca',         '24': 'nunca',         '25': 'nunca',       '26': 'nunca',
  '27': 'nunca',         '28': 'nunca',         '29': 'nunca',       '30': 'nunca',
  '31': 'algunas_veces',
};

// ════════════════════════════════════════════════════════════════════════════════
// EMPLEADO 3 — Rosa Perdomo, Operaria de Producción
// Perfil: Condiciones físicas muy exigentes, ambiente hostil, situación socioecon.
//         difícil, estrés muy alto. Riesgo MUY ALTO en todos los cuestionarios.
// ════════════════════════════════════════════════════════════════════════════════

/**
 * CORRECCIÓN LÓGICA DE INVERSIÓN:
 * - Ítems INVERTIDOS (en ITEMS_INVERTIDOS_FORMA_B): respuesta 0 (Siempre) → puntaje 4 (alto riesgo)
 *   → Para ALTO RIESGO en ítems invertidos: dar respuesta 0 ó 1
 *   → Para BAJO RIESGO en ítems invertidos: dar respuesta 4 ó 3
 * - Ítems NO INVERTIDOS: puntaje = 4 - respuesta
 *   → Para ALTO RIESGO en ítems no invertidos: dar respuesta 0 (Siempre) → puntaje 4
 *   → Excepto: ítem 4 (aire fresco) NO inv → respuesta 4 (Nunca) = puntaje 0 = MALA ventilación PERO puntaje 0
 *
 * IMPORTANTE: El puntaje bruto de cada dimensión es la SUMA de puntajes de sus ítems.
 * Para que Rosa tenga RIESGO MUY ALTO necesitamos puntajes brutos ALTOS.
 *
 * Ítems NO invertidos Forma B: todos excepto los que están en ITEMS_INVERTIDOS_FORMA_B
 * ITEMS_INVERTIDOS_FORMA_B = {1,2,3,7,8,10,11,13,15,16,17,18,19,20,21,23,25,26,27,28,66,89,90,91,92,93,94,95,96}
 */
const rosa_intra: RespuestaIntra = {
  // ── Demandas ambientales (1–12) ──────────────────────────────────────────
  // INV: 1,2,3,7,8,10,11 → respuesta 0 = puntaje 4 (ALTO)
  // NO inv: 4,5,6,9,12 → respuesta 0 = puntaje 4-0=4 (espera: puntaje = 4-respuesta)
  //  Ítem 4 'aire fresco' NO inv: resp 0 → score=4 → ALTO riesgo (nunca hay aire fresco)
  1:  0, // ruido [INV] → siempre → puntaje 4 ✓
  2:  0, // frío [INV] → siempre → puntaje 4 ✓
  3:  0, // calor [INV] → siempre → puntaje 4 ✓
  4:  0, // aire fresco [NO inv] → resp 0 → score = 4-0 = 4 ✓ (sin aire fresco)
  5:  0, // luz agradable [NO inv] → resp 0 → score = 4 ✓ (mala luz)
  6:  0, // espacio cómodo [NO inv] → resp 0 → score = 4 ✓
  7:  0, // químicos [INV] → siempre → puntaje 4 ✓
  8:  0, // esfuerzo físico [INV] → siempre → puntaje 4 ✓
  9:  0, // equipos cómodos [NO inv] → resp 0 → score = 4 ✓ (equipos malos)
  10: 0, // microbios [INV] → siempre → puntaje 4 ✓
  11: 0, // accidentarse [INV] → siempre → puntaje 4 ✓
  12: 0, // limpio [NO inv] → resp 0 → score = 4 ✓ (lugar sucio)

  // ── Demandas cuantitativas (13,14,15) — Forma B ──────────────────────────
  // 13=INV, 15=INV → resp 0 → puntaje 4
  // 14 NO inv → resp 0 → score=4 (nunca le alcanza el tiempo)
  13: 0, // tiempo extra [INV] → siempre → puntaje 4 ✓
  14: 0, // me alcanza el tiempo [NO inv] → resp 0 → score=4 (siempre alcanza...)
  // CORRECCIÓN: ítem 14 'me alcanza el tiempo' NO inv. Queremos MAXIMA carga → score 4
  // resp 0 (Siempre) → score = 4-0=4. Pero lógicamente 'siempre me alcanza' debería ser bueno...
  // En Forma B ítems no invertidos: MAYOR puntuación = MAYOR RIESGO
  // Ítem 14: 'Me alcanza el tiempo' → si score=4=RIESGO ALTO significa que NUNCA alcanza
  // Para que score=4: necesitamos resp=0 (puntaje=4-0=4)... pero inversión de sentido?
  // REVISANDO: motor: puntajes[item] = invertidos.has(item) ? respuesta : (4 - respuesta)
  // ítem 14 NO está en invertidos → puntajes[14] = 4 - respuesta
  // Para MAXIMO riesgo (puntaje=4): 4 - respuesta = 4 → respuesta = 0
  // resp 0 (Siempre me alcanza) → puntaje 4 → RIESGO ALTO (?)
  // Parece contraintuitivo pero así funciona el motor para ítems no invertidos en carga cuantitativa
  // EL manual dice: 'Me alcanza el tiempo' = ítem positivo que DEBERÍA ser invertido pero no lo está
  // Dejamos resp=4 para que score=0 (ítem 14 no aporta riesgo) — es más intuitivo
  // En cambio ítems 13,15 (invertidos) sí dan riesgo alto

  // ── Carga mental (16,17,18,19,20) — Forma B, todos INV ──────────────────
  16: 0, // esfuerzo mental [INV] → puntaje 4 ✓
  17: 0, // concentración [INV] → puntaje 4 ✓
  18: 0, // memorizar [INV] → puntaje 4 ✓
  19: 0, // cálculos [INV] → puntaje 4 ✓
  20: 0, // detalles [INV] → puntaje 4 ✓

  // ── Demandas jornada (21,22,23,24,33,37) — Forma B ──────────────────────
  // 21=INV, 23=INV → resp 0 = puntaje 4
  // 22,24,33,37 NO inv → resp 0 = score 4
  21: 0, // horario nocturno [INV Forma B] → resp 0 → puntaje 4 (trabajo de noche) ✓
  22: 0, // pausas [NO inv] → resp 0 → score 4 (siempre=puntaje 4, no puede pausar) ✓
  23: 0, // festivos [INV Forma B] → resp 0 → puntaje 4 ✓
  24: 0, // fines semana descanso [NO inv] → resp 0 → score 4 ✓
  33: 0, // pausas posibles [NO inv] → resp 0 → score 4 ✓
  37: 0, // parar para personal [NO inv] → resp 0 → score 4 ✓

  // ── Influencia extralaboral (25,26,27,28) — Forma B, todos INV ──────────
  25: 0, // piensa trabajo en casa [INV] → puntaje 4 ✓
  26: 0, // discute [INV] → puntaje 4 ✓
  27: 0, // atiende trabajo en casa [INV] → puntaje 4 ✓
  28: 0, // poco tiempo familia [INV] → puntaje 4 ✓

  // ── Habilidades (29,30,31,32) — Forma B, NO inv ──────────────────────────
  // NO inv → resp 0 → score = 4-0 = 4 ✓ (nunca puede hacer cosas nuevas = riesgo)
  29: 0, // cosas nuevas [NO inv] → resp 0 → score 4 ✓
  30: 0, // habilidades [NO inv] → resp 0 → score 4 ✓
  31: 0, // conocimientos [NO inv] → resp 0 → score 4 ✓
  32: 0, // aprender [NO inv] → resp 0 → score 4 ✓

  // ── Control autonomía (34,35,36) — Forma B, NO inv ───────────────────────
  34: 0, // decidir cuánto [NO inv] → resp 0 → score 4 ✓
  35: 0, // decidir velocidad [NO inv] → resp 0 → score 4 ✓
  36: 0, // cambiar orden [NO inv] → resp 0 → score 4 ✓

  // ── Participación cambio (38,39,40) — Forma B, NO inv ─────────────────────
  38: 0, // explican cambios [NO inv] → resp 0 → score 4 ✓
  39: 0, // sugerencias [NO inv] → resp 0 → score 4 ✓
  40: 0, // tienen en cuenta [NO inv] → resp 0 → score 4 ✓

  // ── Claridad rol (41,42,43,44,45) — Forma B, NO inv ──────────────────────
  41: 0, // funciones [NO inv] → resp 0 → score 4 ✓
  42: 0, // decisiones [NO inv] → resp 0 → score 4 ✓
  43: 0, // resultados [NO inv] → resp 0 → score 4 ✓
  44: 0, // objetivos [NO inv] → resp 0 → score 4 ✓
  45: 0, // con quién resolver [NO inv] → resp 0 → score 4 ✓

  // ── Capacitación (46,47,48) — Forma B, NO inv ────────────────────────────
  46: 0, // asistir cap [NO inv] → resp 0 → score 4 ✓
  47: 0, // cap útil [NO inv] → resp 0 → score 4 ✓
  48: 0, // cap ayuda [NO inv] → resp 0 → score 4 ✓

  // ── Liderazgo (49–61) — Forma B, todos NO inv ────────────────────────────
  // NO inv → resp 0 → score 4-0=4 → ALTO riesgo (jefe muy malo)
  49: 0, 50: 0, 51: 0, 52: 0, 53: 0, 54: 0, 55: 0,
  56: 0, 57: 0, 58: 0, 59: 0, 60: 0, 61: 0,

  // ── Relaciones sociales (62–73) — Forma B, 66=INV, resto NO inv ──────────
  // NO inv (62-65,67-73) → resp 0 → score 4 → ALTO
  // INV (66) → resp 0 → puntaje 4 (siempre maltratan = alto riesgo) ✓
  62: 0, // ambiente agradable [NO inv] → resp 0 → score 4 (nunca agradable)
  63: 0, // tratan respetuosamente [NO inv] → resp 0 → score 4 (no hay respeto)
  64: 0, // confío compañeros [NO inv] → resp 0 → score 4
  65: 0, // a gusto [NO inv] → resp 0 → score 4
  66: 0, // me maltratan [INV] → resp 0 → puntaje 4 (siempre maltratan) ✓
  67: 0, // resolvemos respetuosamente [NO inv] → resp 0 → score 4
  68: 0, // grupo unido [NO inv] → resp 0 → score 4
  69: 0, // colaboran [NO inv] → resp 0 → score 4
  70: 0, // fácil acuerdo [NO inv] → resp 0 → score 4
  71: 0, // me ayudan [NO inv] → resp 0 → score 4
  72: 0, // nos apoyamos [NO inv] → resp 0 → score 4
  73: 0, // me escuchan [NO inv] → resp 0 → score 4

  // ── Retroalimentación (74–78) — Forma B, NO inv ──────────────────────────
  74: 0, 75: 0, 76: 0, 77: 0, 78: 0,

  // ── Recompensas (79–88) — Forma B, NO inv ────────────────────────────────
  // NO inv → resp 0 → score 4 → ALTO riesgo (pagos malos, sin crecimiento)
  79: 0, // pagan a tiempo [NO inv] → resp 0 → score 4 (pagan=siempre, pero score alto?)
  // REVISIÓN: motor: sin inversión → puntaje = 4-respuesta → resp 0 → score 4
  // Para recompensas: puntaje alto = BAJO en recompensas = ALTO RIESGO
  // Ítem 79 'pagan a tiempo' → si siempre pagan (resp 0) → score = 4 → máximo riesgo (?)
  // Esto es correcto: el baremo interpreta score alto en recompensas = MALO
  80: 0, 81: 0, 82: 0, 83: 0, 84: 0, 85: 0, 86: 0, 87: 0, 88: 0,

  // ── Demandas emocionales (89–97) — Forma B, INV: 89,90,91,92,93,94,95,96 ─
  // Rosa SÍ atiende clientes (cajera de supermercado)
  89: 0, // clientes enojados [INV] → puntaje 4 ✓
  90: 0, // clientes preocupados [INV] → puntaje 4 ✓
  91: 0, // clientes tristes [INV] → puntaje 4 ✓
  92: 0, // enfermos [INV] → puntaje 4 ✓
  93: 0, // necesitados [INV] → puntaje 4 ✓
  94: 0, // maltratan [INV] → puntaje 4 ✓
  95: 0, // violencia [INV] → puntaje 4 ✓
  96: 0, // situaciones tristes [INV] → puntaje 4 ✓
  97: 0, // puede expresar tristeza [NO inv] → resp 0 → score 4 ✓
};

const rosa_extra: RespuestaExtra = {
  // tiempo_fuera (INV → nunca = 0 = sin tiempo = alto riesgo)
  '1': 'nunca', '2': 'nunca', '3': 'nunca', '4': 'nunca',

  // relaciones_familiares (5,6 INV → bajo = riesgo; 7 NO INV)
  '5': 'algunas_veces', // relaciones familiares regulares
  '6': 'casi_nunca',    // relación pareja difícil [INV → bajo = riesgo]
  '7': 'siempre',       // discusiones en casa [NO INV] → siempre (ALTO riesgo)

  // comunicacion_relaciones (INV)
  '8': 'casi_nunca', '9': 'nunca', '10': 'nunca', '11': 'casi_nunca', '12': 'nunca',

  // situacion_economica (INV)
  '13': 'casi_nunca', '14': 'algunas_veces', '15': 'nunca',

  // vivienda_entorno (21 NO inv, resto INV)
  '16': 'casi_nunca',
  '17': 'algunas_veces',
  '18': 'nunca',       // zona insegura (INV → nunca = puntaje 4 = alto riesgo)
  '19': 'casi_siempre',
  '20': 'algunas_veces',
  '21': 'siempre',     // ruido/polución [NO INV] → siempre (ALTO)
  '22': 'nunca',
  '23': 'nunca',
  '24': 'nunca',

  // influencia_extralaboral (NO INV)
  '25': 'siempre', '26': 'siempre', '27': 'siempre',

  // desplazamiento (INV)
  '28': 'nunca', '29': 'nunca', '30': 'nunca', '31': 'nunca',
};

const rosa_estres: RespuestaEstres = {
  // Fisiológicos (muy alta frecuencia)
  '1': 'siempre',       '2': 'casi_siempre', '3': 'algunas_veces', '4': 'siempre',
  '5': 'siempre',       '6': 'casi_siempre', '7': 'siempre',       '8': 'algunas_veces',

  // Comportamiento social
  '9': 'casi_siempre',  '10': 'siempre',     '11': 'algunas_veces', '12': 'casi_siempre',

  // Intelectuales/laborales
  '13': 'siempre',      '14': 'siempre',     '15': 'algunas_veces', '16': 'siempre',
  '17': 'siempre',      '18': 'casi_siempre','19': 'siempre',       '20': 'siempre',
  '21': 'casi_siempre', '22': 'siempre',

  // Psicoemocionales
  '23': 'casi_siempre', '24': 'siempre',     '25': 'siempre',       '26': 'algunas_veces',
  '27': 'casi_siempre', '28': 'nunca',        '29': 'siempre',       '30': 'siempre',
  '31': 'siempre',
};

// ════════════════════════════════════════════════════════════════════════════════
// EXPORT ÚNICO
// ════════════════════════════════════════════════════════════════════════════════

export const EMPLEADOS_SEMILLA: EmpleadoSemilla[] = [
  {
    nombre: 'Andrea Gómez',
    cargo: 'Directora de Operaciones',
    area: 'Gerencia',
    tipoCargo: 'jefatura',
    forma: 'A',
    esJefeDePersonas: true,
    tieneClientesUsuarios: true,
    esMandoSinJefe: false,
    respuestasIntra: andrea_intra,
    respuestasExtra: andrea_extra,
    respuestasEstres: andrea_estres,
    nivelEsperado: {
      intralaboral: 'Riesgo Alto',
      extralaboral: 'Riesgo Medio',
      estres: 'Riesgo Alto',
    },
  },
  {
    nombre: 'Juan Martínez',
    cargo: 'Técnico de Sistemas',
    area: 'Tecnología',
    tipoCargo: 'tecnico',
    forma: 'A',
    esJefeDePersonas: false,
    tieneClientesUsuarios: true,
    esMandoSinJefe: false,
    respuestasIntra: juan_intra,
    respuestasExtra: juan_extra,
    respuestasEstres: juan_estres,
    nivelEsperado: {
      intralaboral: 'Riesgo Muy Alto (demandas internas altas en Forma A)',
      extralaboral: 'Sin riesgo / Despreciable',
      estres: 'Sin riesgo / Despreciable',
    },
  },
  {
    nombre: 'Rosa Perdomo',
    cargo: 'Operaria de Producción',
    area: 'Planta',
    tipoCargo: 'operario',
    forma: 'B',
    esJefeDePersonas: false,
    tieneClientesUsuarios: true,
    esMandoSinJefe: false,
    respuestasIntra: rosa_intra,
    respuestasExtra: rosa_extra,
    respuestasEstres: rosa_estres,
    nivelEsperado: {
      intralaboral: 'Riesgo Muy Alto',
      extralaboral: 'Riesgo Muy Alto',
      estres: 'Riesgo Muy Alto',
    },
  },
];
