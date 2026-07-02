
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
let found = 0;

for (const f of files) {
  const content = fs.readFileSync(f, 'utf-8');
  // Check for "Bearer ***" pattern
  if (content.includes('Bearer ***')) {
    console.log('❌', f);
    found++;
  }
  // Check for "Bearer **" or other suspicious patterns
  const matches = content.match(/Bearer\s+\S+/g);
  if (matches) {
    for (const m of matches) {
      if (m.includes('***') || m.includes('Bearer $')) {
        console.log('⚠️', f, '→', m);
      }
    }
  }
}

console.log('\nFiles with Bearer ***:', found);

// Also check login route for username vs email
const loginRoute = 'src/app/api/admin/auth/login/route.ts';
if (fs.existsSync(loginRoute)) {
  const lc = fs.readFileSync(loginRoute, 'utf-8');
  if (lc.includes('username')) console.log('⚠️ login uses "username"');
  if (lc.includes('email')) console.log('✅ login uses "email"');
}
