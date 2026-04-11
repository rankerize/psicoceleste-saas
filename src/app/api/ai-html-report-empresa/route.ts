import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_AI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(request: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: 'Falta configurar GOOGLE_AI_API_KEY en el servidor' }, { status: 500 });
    }

    const { empresaNombre, empleadosEvals, dataArea, dataRadar, totalCriticos } = await request.json();

    if (!empresaNombre) {
      return NextResponse.json({ error: 'Faltan parámetros de la empresa' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Plantilla Base de Instrucción para la Empresa
    const prompt = `Actúa como un desarrollador experto web (Tailwind) y un psicólogo clínico corporativo.
Basado en los siguientes datos de evaluación poblacional de riesgo psicosocial de una empresa, genera EXACTAMENTE y ÚNICAMENTE un documento HTML completo y estructurado en múltiples páginas A4 usando Tailwind CSS. Diseño *premium, corporativo*, similar a SaaS.

DATOS POBLACIONALES:
- Nombre de la Empresa: ${empresaNombre}
- Empleados Evaluados: ${empleadosEvals}
- Casos Críticos (Riesgo Alto Glob): ${totalCriticos}
- Proporciones por Área (Promedios): ${JSON.stringify(dataArea)}
- Matriz de Dominios Promedio: ${JSON.stringify(dataRadar)}

INSTRUCCIONES:
1. El archivo HTML debe empezar estrictamente con '<!DOCTYPE html>'.
2. Incluye en el <head>:
   - '<script src="https://cdn.tailwindcss.com"></script>'
   - '<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>' 
   - '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>'
3. Diseña una vista estructurada usando páginas A4 (.a4-page): 
   '<style> body { background-color: #0f172a; padding: 20px; font-family: ui-sans-serif, system-ui; } .a4-page { width: 210mm; min-height: 297mm; background: white; margin: 0 auto 20px auto; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); padding: 40px; position: relative; overflow: hidden; page-break-after: always; } </style>'

SECCIONES (Obligatorio en este orden, si necesitas más espacio usa varias .a4-page):
1. **Banner Hero Premium**: Cover page de informe Corporativo de "${empresaNombre}" usando una imagen de background (ej. unsplash corporativo) y título grande.
2. **Resumen Demográfico Poblacional**: Métricas globales: Total Evaluados, Casos Críticos, Áreas Intervenidas. Usa Glassmorphism.
3. **Análisis Cualitativo Clínico Organizacional**: Dos o tres párrafos interpretando el nivel de riesgo de la empresa en general. Habla del impacto en la productividad y clima laboral, usa jerga técnica.
4. **Gráficas Modernas POBLACIONALES**: Diseña un dashboard HTML insertando múltiples elementos <canvas> ("chartArea", "chartRadar").
   - Escribe el JS para renderizar usando Chart.js: 
     - "chartArea": Gráfico Bar comparando el Riesgo Intralaboral y Estrés lado a lado, segmentado por Área de ${JSON.stringify(dataArea)}.
     - "chartRadar": Gráfico Radar usando la data de Dominios de ${JSON.stringify(dataRadar)}.
   - ¡VITAL!: Debajo o junto a CADA gráfica, incluye el botón "⬇ Descargar Gráfica" que llama a la función de JS para descargar ese canvas como PNG.
5. **Cierre y Botones Finales**: Agrega en la última página el botón 'onclick="generatePDF()"' con texto "⬇ Descargar Informe Corporativo PDF". Define el script the html2pdf al final del body configurando scale 2.

Tu respuesta DEBE estar completamente conformada por puro HTML. NO AGREGUES COMENTARIOS DE MARKDOWN.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let htmlText = response.text();

    htmlText = htmlText.replace(/^```html\n?/, '').replace(/\n?```$/, '').trim();
    if (htmlText.startsWith('```')) htmlText = htmlText.replace(/^```\n?/, '');

    return NextResponse.json({ success: true, html: htmlText });

  } catch (error: any) {
    console.error('Error generando HTML corporativo:', error);
    return NextResponse.json(
      { error: 'Error interno generativo', details: error.message },
      { status: 500 }
    );
  }
}
