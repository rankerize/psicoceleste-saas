import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_AI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Falta GOOGLE_AI_API_KEY' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { tipoEntidad, nombre, categorias } = body;

    if (!tipoEntidad || !nombre || !categorias) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Eres un psicólogo experto en Seguridad y Salud en el Trabajo en Colombia.
Tu labor es interpretar los resultados estadísticos de la Batería de Riesgo Psicosocial y generar UNA CONCLUSIÓN CUALITATIVA CLÍNICA estructurada y directa (1 o 2 párrafos máximo).

Contexto de la evaluación:
- Tipo: ${tipoEntidad} (Empresa, Área o Empleado)
- Nombre focal: ${nombre}

Resultados Obtenidos (Dominio = Nivel de Riesgo):
${JSON.stringify(categorias, null, 2)}

Instrucciones:
1. Redacta el informe como si fueras el examinador clínico dirigiéndose en el informe formal o gerencial.
2. Identifica los riesgos MÁS altos y explica teóricamente por qué pueden estar ocurriendo.
3. Menciona los riesgos bajos o nulos como factores protectores.
4. No uses lenguaje robótico. No incluyas explicaciones de que eres una IA.
5. Devuelve solo el texto del análisis.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ success: true, analisis: text.trim() });
  } catch (error: any) {
    console.error('Error generando interpretación clínica:', error);
    return NextResponse.json(
      { error: 'Error interno en servicio IA', details: error.message },
      { status: 500 }
    );
  }
}
