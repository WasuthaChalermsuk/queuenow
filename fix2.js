
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
  const original = content;
  // Direct string replace for the exact pattern seen in the files
  if (content.includes('Authorization: ***')) {
    content = content.split('Authorization: ***').join('Authorization: Bearer ');
  }
  // Also check for "*** ${" without Authorization
  if (content.includes('*** ${')) {
    content = content.split('*** ${').join('Bearer ${');
  }
  if (content !== original) {
    fs.writeFileSync(f, content, 'utf-8');
    console.log('FIXED:', f);
    fixed++;
  }
}
console.log('Total fixed:', fixed);
