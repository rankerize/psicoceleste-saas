import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

const apiKey = process.env.GOOGLE_AI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empleadoId = searchParams.get('empleadoId');
    const resultadoId = searchParams.get('resultadoId');

    if (!empleadoId) {
      return NextResponse.json({ error: 'empleadoId requerido' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'Falta configurar GOOGLE_AI_API_KEY en el servidor' }, { status: 500 });
    }

    // 1. Cargar datos del Empleado
    const empSnap = await getDoc(doc(db, 'empleados', empleadoId));
    if (!empSnap.exists()) return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 });
    const empleado = empSnap.data();

    // 2. Cargar Empresa
    let empresa: any = { nombre: 'Organización Desconocida', nit: '' };
    if (empleado.empresaId) {
      const empDoc = await getDoc(doc(db, 'empresas', empleado.empresaId));
      if (empDoc.exists()) empresa = empDoc.data();
    }

    // 3. Cargar Resultado
    let resultado: any = null;
    if (resultadoId) {
      const resSnap = await getDoc(doc(db, 'resultados', resultadoId));
      if (resSnap.exists()) resultado = { id: resSnap.id, ...resSnap.data() };
    } else {
      const q = query(
        collection(db, 'resultados'),
        where('empleadoId', '==', empleadoId),
        where('estado', '==', 'calificado'),
        orderBy('fechaAplicacion', 'desc'),
        limit(1)
      );
      const resDocs = await getDocs(q);
      if (!resDocs.empty) {
        resultado = { id: resDocs.docs[0].id, ...resDocs.docs[0].data() };
      }
    }

    if (!resultado) {
      return NextResponse.json({ error: 'No se encontraron resultados calificados para este empleado.' }, { status: 404 });
    }

    // Preparar el contexto para IA
    const dataContext = {
      empresa: empresa.nombre,
      empleado: {
        nombre: empleado.nombre,
        cedula: empleado.cedula,
        cargo: empleado.cargo || 'No especificado',
        area: empleado.area || 'No especificada',
        genero: empleado.genero || 'No especificado'
      },
      calificacion: resultado.calificacion,
      fecha: resultado.fechaAplicacion || resultado.creadoEn || new Date().toISOString()
    };

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Plantilla Base de Instrucción
    const prompt = `Actúa como un desarrollador experto web (Tailwind) y un psicólogo clínico en Seguridad y Salud en el Trabajo.
Basado en los siguientes datos de evaluación de riesgo psicosocial de un empleado, genera EXACTAMENTE y ÚNICAMENTE un documento HTML completo y estructurado en páginas A4 usando Tailwind CSS. Sigue un diseño *premium, corporativo y estéticamente superior*, similar a las mejores plataformas SaaS del mundo.

DATOS DEL EMPLEADO Y RESULTADOS:
${JSON.stringify(dataContext, null, 2)}

INSTRUCCIONES DE IDENTIDAD VISUAL Y CÓDIGO:
1. El archivo HTML debe empezar estrictamente con '<!DOCTYPE html>'. No incluyas backticks de markdown (como \`\`\`html) ni explicaciones previas o posteriores.
2. Incluye en el <head>:
   - '<script src="https://cdn.tailwindcss.com"></script>'
   - '<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>' 
   - '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>' (Para renderizar Gráficas Modernas).
3. Diseña una vista estructurada simulando hojas A4 (.a4-page): 
   '<style> body { background-color: #0f172a; padding: 20px; font-family: ui-sans-serif, system-ui; } .a4-page { width: 210mm; min-height: 297mm; background: white; margin: 0 auto 20px auto; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); padding: 40px; position: relative; overflow: hidden; } </style>'

SECCIONES DEL REPORTE (Obligatorio en este orden):
1. **Banner Hero Premium**: Inicia la primera página (dentro de .a4-page) con un banner espectacular. Puedes usar imágenes limpias y de negocios de Unsplash integrando una capa oscura o de color. Ejemplo de placeholder de Unsplash corporativo: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80' (o similar) como fondo de cobertura con un titulo centrado encima con gradientes.
2. **Resumen Demográfico**: Tabla o tarjetas premium (Glassmorphism) mostrando Cédula, Nombre, Cargo, etc.
3. **Análisis Cualitativo Clínico**: Redacta 2 párrafos impecables interpretando psicológicamente el nivel de riesgo de este usuario particular usando jerga técnica, basado en sus datos reales inyectados. Colorea de rojo suave los altos riesgos y de verde los bajos (usando clases de Tailwind text-red-500, etc.).
4. **Gráficas Modernas de Resultados**: Dedícale una tarjeta HTML hermosa a insertar elementos <canvas id="chart1"></canvas>. 
   - Escribe bajo todo el código HTML la respectiva inicialización JavaScript de Chart.js ('<script> new Chart(document.getElementById("chart1"), { ... }); </script>') leyendo los puntajes del JSON de calificación suministrado en esta instrucción para crear una espectacular de barras verticales (o gráfica Radar si aplica) dibujando el Riesgo Intralaboral y el Indice de Estrés de este empleado. Usa esquemas de colores vibrantes y modernos como '#0ea5e9' y '#8b5cf6' para que las barras se vean premium.
5. **Cierre y Botón de PDF**: 
   - Agrega este botón elegante en la cabecera o pie de la página: '<button onclick="generatePDF()" class="bg-slate-900 text-white font-bold py-3 px-6 rounded-xl shadow-2xl hover:scale-105 transition-all mb-4 text-center mt-8 cursor-pointer">⬇ Descargar PDF Original</button>'
   - Agrega este script de exportación al final del body: '<script> function generatePDF() { const element = document.getElementById("report-content"); const opt = { margin: [10, 0], filename: "Reporte_Psico_${empleado.cedula}.pdf", image: { type: "jpeg", quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: "mm", format: "a4", orientation: "portrait" } }; html2pdf().set(opt).from(element).save(); } </script>'

Aplica toda tu creatividad para entregar una interfaz deslumbrante estilo Stripe o Vercel. 
Tu respuesta DEBE estar completamente conformada por puro HTML. NO AGREGUES COMENTARIOS. OMITE TICKETS O BLOQUES MARKDOWN ALREDEDOR (\`\`\`).`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let htmlText = response.text();

    // Limpiar posibles bloques markdown si Gemini los incluye de todos modos:
    htmlText = htmlText.replace(/^```html\n?/, '').replace(/\n?```$/, '').trim();
    if (htmlText.startsWith('```')) htmlText = htmlText.replace(/^```\n?/, '');

    // Si se pide formato HTML nativo (visor a pantalla completa), devolverlo directo
    if (searchParams.get('format') === 'html') {
      return new NextResponse(htmlText, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    return NextResponse.json({ success: true, html: htmlText });

  } catch (error: any) {
    console.error('Error generando reporte HTML IA:', error);
    return NextResponse.json(
      { error: 'Error interno en servicio IA', details: error.message },
      { status: 500 }
    );
  }
}
