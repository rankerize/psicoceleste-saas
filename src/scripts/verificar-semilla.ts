/**
 * Script de verificación de datos semilla
 * Ejecutar con: npx tsx src/scripts/verificar-semilla.ts
 *
 * Califica los 3 empleados de prueba usando los motores de scoring oficiales
 * y muestra los resultados en formato legible.
 */

import { EMPLEADOS_SEMILLA } from '../lib/seed-empleados';
import { calificarIntralaboral, RISK_LABELS } from '../lib/bateria/scoring-intralaboral';
import { calcularExtralaboral, NOMBRES_DIMENSION_EXTRA } from '../lib/bateria/scoring-extralaboral';
import { calcularEstres, NIVEL_LABEL, CATEGORIAS_LABEL } from '../lib/bateria/scoring-estres';

const NIVEL_COLOR: Record<string, string> = {
  sin_riesgo: '\x1b[32m', // verde
  bajo:        '\x1b[34m', // azul
  medio:       '\x1b[33m', // amarillo
  alto:        '\x1b[91m', // rojo claro
  muy_alto:    '\x1b[31m', // rojo
};
const RESET = '\x1b[0m';
const BOLD  = '\x1b[1m';

function colorNivel(nivel: string, label: string): string {
  return `${NIVEL_COLOR[nivel] ?? ''}${BOLD}${label}${RESET}`;
}

function separador(char = '─', n = 60) {
  console.log(char.repeat(n));
}

for (const emp of EMPLEADOS_SEMILLA) {
  console.log('\n');
  separador('═');
  console.log(`${BOLD}👤 ${emp.nombre}${RESET}  —  ${emp.cargo} (${emp.area})`);
  console.log(`   Forma: ${emp.forma} | Cargo: ${emp.tipoCargo}`);
  console.log(`   Jefe de personas: ${emp.esJefeDePersonas ? 'Sí' : 'No'} | Atiende clientes: ${emp.tieneClientesUsuarios ? 'Sí' : 'No'}`);
  separador('─');

  // ── Intralaboral ────────────────────────────────────────────────────────────
  console.log(`\n${BOLD}📊 CUESTIONARIO INTRALABORAL (Forma ${emp.forma})${RESET}`);

  const intra = calificarIntralaboral(
    emp.forma,
    emp.respuestasIntra,
    emp.esMandoSinJefe,
    emp.tieneClientesUsuarios,
    emp.esJefeDePersonas,
  );

  console.log('\n  Dimensiones:');
  for (const [key, dim] of Object.entries(intra.dimensiones)) {
    const label = RISK_LABELS[dim.nivelRiesgo];
    console.log(`    ${key.padEnd(30)} PT=${String(dim.puntajeTransformado).padStart(5)}  ${colorNivel(dim.nivelRiesgo, label)}`);
  }

  console.log('\n  Dominios:');
  for (const [key, dom] of Object.entries(intra.dominios)) {
    const label = RISK_LABELS[dom.nivelRiesgo];
    console.log(`    ${key.padEnd(30)} PT=${String(dom.puntajeTransformado).padStart(5)}  ${colorNivel(dom.nivelRiesgo, label)}`);
  }

  const totalLabel = RISK_LABELS[intra.totalIntralaboral.nivelRiesgo];
  console.log(`\n  ${BOLD}TOTAL INTRALABORAL:${RESET} PT=${intra.totalIntralaboral.transformado}  → ${colorNivel(intra.totalIntralaboral.nivelRiesgo, totalLabel)}`);
  console.log(`  Nivel esperado: ${BOLD}${emp.nivelEsperado.intralaboral}${RESET}`);

  // ── Extralaboral ────────────────────────────────────────────────────────────
  console.log(`\n${BOLD}🏠 CUESTIONARIO EXTRALABORAL${RESET}`);

  const extra = calcularExtralaboral(emp.respuestasExtra, emp.tipoCargo);

  console.log('\n  Dimensiones:');
  for (const dim of extra.dimensiones) {
    const label = RISK_LABELS[dim.nivelRiesgo];
    const nombre = NOMBRES_DIMENSION_EXTRA[dim.dimension] ?? dim.dimension;
    console.log(`    ${nombre.substring(0, 42).padEnd(42)} PT=${String(dim.puntajeTransformado).padStart(5)}  ${colorNivel(dim.nivelRiesgo, label)}`);
  }

  const extraLabel = RISK_LABELS[extra.nivelRiesgoTotal];
  console.log(`\n  ${BOLD}TOTAL EXTRALABORAL:${RESET} PT=${extra.puntajeTransformadoTotal}  → ${colorNivel(extra.nivelRiesgoTotal, extraLabel)}`);
  console.log(`  Nivel esperado: ${BOLD}${emp.nivelEsperado.extralaboral}${RESET}`);

  // ── Estrés ──────────────────────────────────────────────────────────────────
  console.log(`\n${BOLD}😓 CUESTIONARIO DE ESTRÉS${RESET}`);

  const estres = calcularEstres(emp.respuestasEstres);

  console.log('\n  Categorías:');
  for (const [key, val] of Object.entries(estres.categorias)) {
    console.log(`    ${(CATEGORIAS_LABEL[key] ?? key).padEnd(42)} Bruto=${val}`);
  }

  const estresLabel = NIVEL_LABEL[estres.nivelRiesgo];
  console.log(`\n  ${BOLD}TOTAL ESTRÉS:${RESET} Bruto=${estres.puntajeBruto}/93  PT=${estres.puntajeTransformado}  → ${colorNivel(estres.nivelRiesgo, estresLabel)}`);
  console.log(`  Nivel esperado: ${BOLD}${emp.nivelEsperado.estres}${RESET}`);

  separador('═');
}

console.log('\n✅ Verificación completa. Revisa que los niveles REALES coincidan con los ESPERADOS.\n');
