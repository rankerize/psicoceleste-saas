const fs = require('fs');
const path = require('path');

const DIRECTORIES = [
  path.join(__dirname, '../app/dashboard'),
];

const REPLACEMENTS = [
  // Backgrounds & Borders
  { from: /bg-slate-900\/50/g, to: 'bg-slate-100' },
  { from: /bg-slate-900/g, to: 'bg-slate-50' },
  { from: /bg-slate-800\/50/g, to: 'bg-slate-50' },
  { from: /bg-slate-800\/40/g, to: 'bg-slate-50' },
  { from: /bg-slate-800\/80/g, to: 'bg-slate-100' },
  { from: /bg-slate-800/g, to: 'bg-white' },
  { from: /border-white\/10/g, to: 'border-slate-200' },
  { from: /border-white\/5/g, to: 'border-slate-100' },
  { from: /border-slate-700/g, to: 'border-slate-200' },
  { from: /hover:bg-white\/5/g, to: 'hover:bg-slate-50' },
  { from: /hover:bg-slate-800\/40/g, to: 'hover:bg-slate-50' },
  { from: /bg-white\/10/g, to: 'bg-slate-200' },
  { from: /bg-white\/5/g, to: 'bg-slate-100' },
  
  // Texts - carefully replacing only specific instances to avoid buttons
  // text-white in standard text tags (h1, h2, h3, p, span inside cards)
  { from: /text-white/g, to: 'text-slate-900' },
  // Wait, btn-primary has text-white but it's defined in CSS, so TSX text-white is usually for headings.
  // Except for some badges... let's replace text-slate-300 to text-slate-600
  { from: /text-slate-300/g, to: 'text-slate-600' },
  { from: /text-slate-400/g, to: 'text-slate-500' },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.tsx') && fullPath.indexOf('layout.tsx') === -1) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      REPLACEMENTS.forEach(({from, to}) => {
        content = content.replace(from, to);
      });
      
      // Fix buttons accidentally made slate-900 (like inside btn-primary)
      // Usually we don't have text-white inside btn-primary in TSX, since btn-primary from CSS applies color: white. 
      // But if there are, we can patch later.

      // Fix Search Inputs directly in code (the padding issue)
      // For `<input ... />` with 'w-full bg-transparent'
      content = content.replace(/className="(.*?)bg-transparent(.*?)pl-10(.*?)"/g, 'className="$1bg-transparent$2$3" style={{ paddingLeft: "3rem" }}');
      
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Processed: ${fullPath}`);
    }
  }
}

DIRECTORIES.forEach(dir => processDirectory(dir));
console.log('Theme conversion complete.');
