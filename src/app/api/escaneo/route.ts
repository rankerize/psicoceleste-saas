import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Instanciar Gemini
const apiKey = process.env.GOOGLE_AI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Falta configurar GOOGLE_AI_API_KEY en el entorno' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('imagen') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se envió ninguna imagen' }, { status: 400 });
    }

    // Convertir a ArrayBuffer para la API de Gemini
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Configurar modelo. Gemini 1.5 Flash es veloz y barato para imágenes + texto
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Eres un sistema OMR experto en digitación médica/ocupacional. 
Esta es una fotografía de una página de la 'Batería de Riesgo Psicosocial' oficial de Colombia.
Tu tarea es leer las X, recuadros rellenos o chulos (✓) que el paciente marcó con lapicero.

Instrucciones:
1. Identifica el número de la pregunta en cada fila.
2. Identifica en qué columna marcó la respuesta de la escala Likert (comúnmente Siempre, Casi siempre, Algunas veces, Casi nunca, Nunca). A veces la escala cambia dependiendo del cuadernillo. Asume que la columna izquierda es 1 y avanza secuencialmente. 
3. Retorna la salida ÚNICAMENTE en formato JSON.
El JSON debe tener la estructura: { "numero_pregunta": "valor_detectado" } 
No agregues explicaciones, markdown, ni disculpas. Si no logras leer una marca porque está muy confusa, no agregues esa pregunta al resultado JSON.`;

    const imageParts = [
      {
        inlineData: {
          data: buffer.toString('base64'),
          mimeType: file.type,
        },
      },
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    let text = response.text();

    // Limpiar posibles bloques markdown si la IA no obedece estrictamente
    if (text.startsWith('```json')) {
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    } else if (text.startsWith('```')) {
      text = text.replace(/```/g, '').trim();
    }

    try {
      const parsedJson = JSON.parse(text);
      return NextResponse.json({ success: true, extraccion: parsedJson });
    } catch (parseError) {
      console.error("Error parseando respuesta JSON de Gemini:", text);
      return NextResponse.json(
        { error: 'La IA no pudo formatear la respuesta óptica. Verifica la claridad de la foto.' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Error procesando imagen OCR:', error);
    return NextResponse.json(
      { error: 'Error interno en servicio OCR', details: error.message },
      { status: 500 }
    );
  }
}
