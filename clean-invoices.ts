import fs from 'fs';
const content = fs.readFileSync('src/pages/Invoices.tsx', 'utf-8');
const lines = content.split('\n');
const fixed = lines.slice(0, 830).join('\n') + '\n';
fs.writeFileSync('src/pages/Invoices.tsx', fixed, 'utf-8');
