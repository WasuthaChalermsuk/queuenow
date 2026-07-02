
import os, re

fixed = 0
for root, dirs, files in os.walk('src'):
    dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'node_modules']
    for f in files:
        if not (f.endswith('.ts') or f.endswith('.tsx')):
            continue
        path = os.path.join(root, f)
        with open(path, 'r', encoding='utf-8') as fh:
            content = fh.read()
        
        original = content
        # Direct string replace
        content = content.replace('Authorization: *** ', 'Authorization: Bearer ')
        # Also handle cases without "Authorization: " prefix
        content = content.replace("*** ${", "Bearer ${")
        
        if content != original:
            with open(path, 'w', encoding='utf-8') as fh:
                fh.write(content)
            print(f'FIXED: {path}')
            fixed += 1

print(f'Total fixed: {fixed}')

# Verify
with open('src/app/admin/page.tsx', 'r', encoding='utf-8') as f:
    for line in f:
        if 'Authorization' in line:
            print('VERIFY:', line.strip()[:120])
