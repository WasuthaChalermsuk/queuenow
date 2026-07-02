
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

// Fix C2 + C3: Remove "*** " prefix from Authorization headers
const files = walk('src');
let fixed = 0;
for (const f of files) {
  let content = fs.readFileSync(f, 'utf-8');
  if (content.includes('*** ${')) {
    content = content.replace(/\*\*\* \$\{/g, 'Bearer ${');
    // Also fix "Bearer *** " if it exists
    content = content.replace(/\*\*\* \$\{/g, 'Bearer ${');
    // Fix "Authorization: *** " 
    content = content.replace(/Authorization: \*\*\* /g, 'Authorization: Bearer ');
    fs.writeFileSync(f, content, 'utf-8');
    console.log('✅', f);
    fixed++;
  }
}

console.log('\nFixed', fixed, 'files');

// Fix C1: Check login route
const loginFile = 'src/app/api/admin/auth/login/route.ts';
let loginContent = fs.readFileSync(loginFile, 'utf-8');
if (loginContent.includes('username')) {
  // Replace username with email in Zod schema
  loginContent = loginContent.replace('username: z.string()', 'email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง")');
  loginContent = loginContent.replace('const { username', 'const { email');
  loginContent = loginContent.replace('where: { email: username }', 'where: { email }');
  fs.writeFileSync(loginFile, loginContent, 'utf-8');
  console.log('✅ Fixed login route: username → email');
}
