import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { calificarIntralaboral } from '@/lib/bateria/scoring-intralaboral';
import { calcularExtralaboral } from '@/lib/bateria/scoring-extralaboral';
import { calcularEstres } from '@/lib/bateria/scoring-estres';

export async function POST(request: NextRequest) {
  try {
    const { resultadoId } = await request.json();
    if (!resultadoId) return NextResponse.json({ error: 'resultadoId requerido' }, { status: 400 });

    const snap = await getDoc(doc(db, 'resultados', resultadoId));
    if (!snap.exists()) return NextResponse.json({ error: 'Resultado no encontrado' }, { status: 404 });

    const data = snap.data();
    const forma = (data.forma ?? 'B') as 'A' | 'B';

    // Convertir respuestas de string→number (0-4)
    const rawIntra = data.respuestasIntralaboral ?? {};
    const respIntra: Record<number, 0 | 1 | 2 | 3 | 4> = {};
    const OPCION_A_NUM: Record<string, 0 | 1 | 2 | 3 | 4> = {
      siempre: 0, casi_siempre: 1, algunas_veces: 2, casi_nunca: 3, nunca: 4
    };
    for (const [k, v] of Object.entries(rawIntra)) {
      respIntra[parseInt(k)] = OPCION_A_NUM[v as string] ?? 2;
    }

    const intra = calificarIntralaboral(
      forma,
      respIntra,
      false,                              // esMandoSinJefe
      data.atiendaClientes !== false,     // tieneClientesUsuarios
      data.esJefe === true,               // esJefeDePersonas
    );

    const extra  = calcularExtralaboral(data.respuestasExtralaboral ?? {}, data.tipoCargo ?? 'auxiliar');
    const estres = calcularEstres(data.respuestasEstres ?? {});

    await updateDoc(doc(db, 'resultados', resultadoId), {
      calificacion: {
        intra:  JSON.parse(JSON.stringify(intra)),
        extra:  JSON.parse(JSON.stringify(extra)),
        estres: JSON.parse(JSON.stringify(estres)),
      },
      estado: 'calificado',
      calificadoEn: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
