
const fs = require('fs');
const lines = fs.readFileSync('src/app/admin/page.tsx', 'utf-8').split('\n');
const line = lines[49]; // Line with Authorization
console.log('LINE:', JSON.stringify(line.substring(0, 80)));
console.log('CHARS:', [...line.substring(0, 80)].map(c => c.charCodeAt(0)).join(','));
