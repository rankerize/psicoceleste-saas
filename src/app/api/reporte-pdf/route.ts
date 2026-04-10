import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { ReportePDF, type PDFData } from '@/lib/pdf/reporte-template';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empleadoId = searchParams.get('empleadoId');
    const resultadoId = searchParams.get('resultadoId');

    if (!empleadoId) {
      return NextResponse.json({ error: 'empleadoId requerido' }, { status: 400 });
    }

    // ── 1. Cargar empleado ────────────────────────────────────────────────────
    const empSnap = await getDoc(doc(db, 'empleados', empleadoId));
    if (!empSnap.exists()) {
      return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 });
    }
    const empleado = empSnap.data();

    // ── 2. Cargar empresa ─────────────────────────────────────────────────────
    let empresa = { nombre: '', nit: '' };
    if (empleado.empresaId) {
      const empDoc = await getDoc(doc(db, 'empresas', empleado.empresaId));
      if (empDoc.exists()) empresa = empDoc.data() as typeof empresa;
    }

    // ── 3. Cargar psicólogo ───────────────────────────────────────────────────
    let psicologo = { nombre: 'Evaluador', tarjeta: '', licencia: '', especializacion: '' };
    if (empleado.psicologo) {
      const psiSnap = await getDoc(doc(db, 'users', empleado.psicologo));
      if (psiSnap.exists()) {
        const d = psiSnap.data();
        psicologo = {
          nombre: d.nombre ?? d.displayName ?? 'Evaluador',
          tarjeta: d.tarjetaProfesional ?? '',
          licencia: d.licenciaSO ?? '',
          especializacion: d.especializacion ?? 'Psicología Organizacional',
        };
      }
    }

    // ── 4. Cargar resultado calificado ────────────────────────────────────────
    let resultado: Record<string, unknown> | null = null;
    if (resultadoId) {
      const resSnap = await getDoc(doc(db, 'resultados', resultadoId));
      if (resSnap.exists()) resultado = { id: resSnap.id, ...resSnap.data() };
    } else {
      // Ultimo resultado calificado
      const q = query(
        collection(db, 'resultados'),
        where('empleadoId', '==', empleadoId),
        where('estado', '==', 'calificado'),
        orderBy('fechaAplicacion', 'desc'),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) resultado = { id: snap.docs[0].id, ...snap.docs[0].data() };
    }

    if (!resultado || !resultado.calificacion) {
      return NextResponse.json(
        { error: 'No hay resultados calificados para este empleado' },
        { status: 404 }
      );
    }

    const cal = resultado.calificacion as {
      intra: Record<string, unknown>;
      extra: Record<string, unknown>;
      estres: Record<string, unknown>;
    };

    // ── 5. Construir objeto de datos para el PDF ──────────────────────────────
    const fecha = new Date().toLocaleDateString('es-CO', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    const TIPOS_CARGO_LABEL: Record<string, string> = {
      jefatura: 'Jefatura / Dirección',
      profesional: 'Profesional / Analista',
      tecnico: 'Técnico / Tecnólogo',
      auxiliar: 'Auxiliar / Asistente',
      operario: 'Operario / Servicios generales',
    };

    // Construir dominios con dimensiones anidadas
    const intraFull = cal.intra as {
      forma: 'A' | 'B';
      dominios: Record<string, {
        nombre: string;
        puntajeTransformado: number;
        nivelRiesgo: string;
      }>;
      dimensiones: Record<string, { puntajeTransformado: number; nivelRiesgo: string }>;
      totalIntralaboral: { transformado: number; nivelRiesgo: string };
    };

    const DIMS_POR_DOMINIO: Record<string, string[]> = {
      liderazgo_relaciones: ['caracteristicas_liderazgo', 'relaciones_sociales', 'retroalimentacion_desempeno', 'relacion_colaboradores'],
      control:              ['claridad_rol', 'capacitacion', 'participacion_cambio', 'oportunidades_habilidades', 'control_autonomia'],
      demandas:             ['demandas_ambientales', 'demandas_emocionales', 'demandas_cuantitativas', 'influencia_extralaboral', 'exigencias_responsabilidad', 'demandas_carga_mental', 'consistencia_rol', 'demandas_jornada'],
      recompensas:          ['recompensas_pertenencia', 'reconocimiento_compensacion'],
    };

    const dominiosConDims = Object.fromEntries(
      Object.entries(intraFull.dominios).map(([domId, dom]) => [
        domId,
        {
          ...dom,
          dimensiones: Object.fromEntries(
            (DIMS_POR_DOMINIO[domId] ?? [])
              .filter(dimId => intraFull.dimensiones?.[dimId])
              .map(dimId => [dimId, intraFull.dimensiones[dimId]])
          ),
        },
      ])
    );

    const pdfData: PDFData = {
      empleado: {
        nombre:    empleado.nombre ?? '',
        cedula:    empleado.cedula ?? '',
        cargo:     empleado.cargo ?? '',
        area:      empleado.area ?? '',
        empresa:   empresa.nombre,
        nit:       empresa.nit,
        tipoCargo: TIPOS_CARGO_LABEL[empleado.tipoCargo] ?? empleado.tipoCargo ?? '',
      },
      psicologo,
      fecha,
      forma: (intraFull.forma ?? resultado.forma ?? 'B') as 'A' | 'B',
      intra: {
        dominios: dominiosConDims as PDFData['intra']['dominios'],
        totalIntralaboral: intraFull.totalIntralaboral,
      },
      extra: cal.extra as PDFData['extra'],
      estres: cal.estres as PDFData['estres'],
    };

    // ── 6. Renderizar PDF ─────────────────────────────────────────────────────
    const pdfDoc = React.createElement(ReportePDF, { data: pdfData }) as Parameters<typeof renderToBuffer>[0];
    const buffer = await renderToBuffer(pdfDoc);
    const uint8 = new Uint8Array(buffer);

    const filename = `perfil-riesgo-${empleado.nombre?.replace(/\s+/g, '-') ?? empleadoId}.pdf`;

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': uint8.byteLength.toString(),
      },
    });

  } catch (err: unknown) {
    console.error('[PDF] Error:', err);
    const msg = err instanceof Error ? err.message : 'Error generando PDF';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
