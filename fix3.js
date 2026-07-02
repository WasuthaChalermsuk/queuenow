
const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      files.push(...walk(p));
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      files.push(p);
    }
  }
  return files;
}

const files = walk('src');
let fixed = 0;
for (const f of files) {
  let content = fs.readFileSync(f, 'utf-8');
  let changed = false;
  
  // Pattern: "Authorization: *** " -> "Authorization: Bearer "
  if (content.indexOf('Authorization: *** ') !== -1) {
    content = content.replace(/Authorization: \*\*\* /g, 'Authorization: Bearer ');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(f, content, 'utf-8');
    console.log('FIXED:', f);
    fixed++;
  }
}
console.log('Total fixed:', fixed);

// Verify one file
const check = fs.readFileSync('src/app/admin/page.tsx', 'utf-8');
console.log('\nVerify admin/page.tsx:');
const lines = check.split('\n');
for (const l of lines) {
  if (l.includes('Authorization')) {
    console.log(' ', l.trim().substring(0, 100));
  }
}
