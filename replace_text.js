const fs = require('fs');
const path = require('path');

const files = [
  'src/lib/docx/reporte-empresa.ts',
  'src/lib/pdf/reporte-template.tsx',
  'src/lib/seed-empleados.ts',
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/app/globals.css',
  'src/app/dashboard/layout.tsx',
  'src/app/dashboard/suscripcion/page.tsx',
  'src/app/api/mercadopago/preference/route.ts',
  'src/app/dashboard/page.tsx',
  'src/app/auth/register/page.tsx',
  'src/app/bateria/[cedula]/page.tsx'
];

for (const rel of files) {
  const p = path.join('/Users/cesarjimenezarcia/Documents/karol sst/psicoceleste-saas/', rel);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    content = content.replace(/PsicoCeleste/g, 'Psicolab');
    content = content.replace(/psicoceleste/g, 'psicolab');
    content = content.replace(/PSICOCELESTE/g, 'PSICOLAB');
    fs.writeFileSync(p, content);
    console.log('Updated ' + rel);
  }
}
