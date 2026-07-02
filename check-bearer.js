
const fs = require('fs');

// Check the actual Bearer format
const files = ['src/app/admin/page.tsx', 'src/lib/line.ts', 'src/app/api/admin/auth/login/route.ts'];
for (const f of files) {
  const c = fs.readFileSync(f, 'utf-8');
  // Find Bearer lines
  const lines = c.split('\n');
  for (const l of lines) {
    if (l.includes('Bearer')) {
      console.log(f + ':', l.trim().substring(0, 100));
    }
  }
  console.log('---');
}
