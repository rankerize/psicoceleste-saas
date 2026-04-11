import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType, PageBreak } from 'docx';

export interface CompanyDocxData {
  empresaNombre: string;
  psicologoNombre: string;
  periodo: string;
  fecha: string;
  aiReport: string | null;
  estadisticas: {
    totalEvaluados: number;
    riesgoAlto: number;
    riesgoBajo: number;
  };
  areas: { name: string; EstresPromedio: number; IntralaboralPromedio: number }[];
}

export async function generarReporteWord(data: CompanyDocxData): Promise<Blob> {
  const primaryColor = '0EA5E9'; // Celeste
  const darkNavy = '0F172A'; // Slate 900

  // ── Sección 1: Portada ──
  const portada = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'PsicoCeleste SaaS',
          bold: true,
          size: 48, // 24pt
          color: primaryColor,
        }),
      ],
      spacing: { before: 2000, after: 400 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'INFORME DE CONDICIONES DE RIESGO PSICOSOCIAL',
          bold: true,
          size: 32, // 16pt
          color: darkNavy,
        }),
      ],
      spacing: { after: 1200 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `Empresa: `, bold: true, size: 28 }),
        new TextRun({ text: data.empresaNombre, size: 28 }),
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `Periodo Evaluado: `, bold: true, size: 28 }),
        new TextRun({ text: data.periodo, size: 28 }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `Evaluadores: `, bold: true, size: 24 }),
        new TextRun({ text: data.psicologoNombre, size: 24 }),
      ],
      spacing: { after: 800 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `Fecha de emisión: ${data.fecha}`, italic: true, size: 20 }),
      ],
      spacing: { after: 400 },
    }),
    new Paragraph({ children: [new PageBreak()] })
  ];

  // ── Sección 2: Metodología ──
  const metodologia = [
    new Paragraph({
      text: '1. Metodología Aplicada',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      text: 'El presente diagnóstico clínico y organizacional se desarrolló empleando la "Batería de Instrumentos para la Evaluación de Factores de Riesgo Psicosocial" avalada por el Ministerio del Trabajo de Colombia y la Pontificia Universidad Javeriana. Su aplicación está amparada normativamente por las Resoluciones 2646 de 2008 y 2404 de 2019.',
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: `Se procesaron y cualificaron un total de ${data.estadisticas.totalEvaluados} muestras psicométricas individuales, tabulando los factores protectores e intervinientes intralaborales, extralaborales y las métricas de estrés agudo/crónico sintomatológico.`,
      spacing: { after: 400 },
    }),
  ];

  // ── Sección 3: Análisis de la IA ──
  const aiSection = data.aiReport ? [
    new Paragraph({
      text: '2. Interpretación Clínica Generativa (Inteligencia Artificial)',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    ...data.aiReport.split('\n\n').map(p => new Paragraph({
      text: p.replace(/\*\*/g, ''), // limpiar Markdown basico si existiera
      spacing: { after: 200 },
      alignment: AlignmentType.JUSTIFIED,
    })),
    new Paragraph({ children: [new PageBreak()] })
  ] : [
    new Paragraph({
      text: '2. Interpretación Clínica',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      text: 'No se procesó inferencia clínica automatizada por Gemini en esta ocasión.',
      spacing: { after: 400 },
    }),
  ];

  // ── Sección 4: Estadísticas Cuantitativas ──
  const tablaHeader = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ text: 'Área Organizacional', bold: true, alignment: AlignmentType.CENTER })],
        shading: { fill: "E2E8F0" },
        margins: { top: 100, bottom: 100, left: 100, right: 100 },
      }),
      new TableCell({
        children: [new Paragraph({ text: 'Riesgo Intralaboral Prom. (0-100)', bold: true, alignment: AlignmentType.CENTER })],
        shading: { fill: "E2E8F0" },
        margins: { top: 100, bottom: 100, left: 100, right: 100 },
      }),
      new TableCell({
        children: [new Paragraph({ text: 'Estrés Sintomático Prom. (0-100)', bold: true, alignment: AlignmentType.CENTER })],
        shading: { fill: "E2E8F0" },
        margins: { top: 100, bottom: 100, left: 100, right: 100 },
      }),
    ],
  });

  const tablaRows = data.areas.map(area => new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ text: area.name })],
        margins: { top: 100, bottom: 100, left: 100, right: 100 },
      }),
      new TableCell({
        children: [new Paragraph({ text: area.IntralaboralPromedio.toString(), alignment: AlignmentType.CENTER })],
        margins: { top: 100, bottom: 100, left: 100, right: 100 },
      }),
      new TableCell({
        children: [new Paragraph({ text: area.EstresPromedio.toString(), alignment: AlignmentType.CENTER })],
        margins: { top: 100, bottom: 100, left: 100, right: 100 },
      }),
    ],
  }));

  const tabla = new Table({
    rows: [tablaHeader, ...tablaRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
    },
  });

  const estadisticasSection = [
    new Paragraph({
      text: '3. Resultados Cuantitativos por Área',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    tabla,
    new Paragraph({
        text: `Se destaca que existe un total de ${data.estadisticas.riesgoAlto} trabajadores en segmento de Alto/Muy Alto Riesgo psicosocial que requieren inclusión prioritaria en los programas de vigilancia epidemiológica (SVE).`,
        spacing: { before: 400, after: 200 },
    })
  ];

  const doc = new Document({
    creator: 'PsicoCeleste SaaS',
    title: `Informe Corporativo - ${data.empresaNombre}`,
    description: 'Diagnóstico Psicosocial Clínico y Organizacional',
    sections: [
      {
        properties: {},
        children: [
          ...portada,
          ...metodologia,
          ...aiSection,
          ...estadisticasSection,
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}
