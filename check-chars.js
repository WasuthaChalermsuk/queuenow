
const fs = require('fs');
const c = fs.readFileSync('src/app/admin/page.tsx', 'utf-8');
// Find the Authorization line
const lines = c.split('\n');
for (const l of lines) {
  if (l.includes('Authorization')) {
    // Show char codes
    const chars = [...l.trim()].map(ch => ch + '(' + ch.charCodeAt(0) + ')').join(' ');
    console.log('LINE:', l.trim());
    console.log('CHARS:', chars.substring(0, 200));
    break;
  }
}
