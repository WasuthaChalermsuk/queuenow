
import os

files_to_check = [
    'src/app/admin/page.tsx',
    'src/app/admin/settings/page.tsx', 
    'src/app/admin/staff/page.tsx',
    'src/lib/line.ts',
    'src/lib/hooks/use-customer-auth.ts',
]

for path in files_to_check:
    if not os.path.exists(path):
        print(f'MISSING: {path}')
        continue
    
    with open(path, 'rb') as f:
        content = f.read()
    
    # Find "Authorization" occurrences
    idx = 0
    found = 0
    while True:
        idx = content.find(b'Authorization', idx)
        if idx == -1:
            break
        
        # Get 30 bytes after "Authorization: "
        colon_pos = content.find(b':', idx)
        if colon_pos == -1:
            break
            
        snippet = content[colon_pos+1:colon_pos+20]
        # Check for asterisk (0x2a) vs backtick (0x60)
        has_asterisk = 0x2a in snippet[:5]
        has_backtick = 0x60 in snippet[:5]
        
        decoded = snippet.decode('utf-8', errors='replace')[:15]
        print(f'{path}: "{decoded}" | has_*: {has_asterisk} | has_backtick: {has_backtick}')
        
        found += 1
        idx += 14
    
    if found == 0:
        # Search for "Bearer"
        bidx = content.find(b'Bearer')
        if bidx > 0:
            snippet = content[bidx-2:bidx+15]
            print(f'{path}: Bearer context: "{snippet.decode("utf-8", errors="replace")}"')
        else:
            print(f'{path}: No Authorization or Bearer found')

print()
print('CONCLUSION:')
print('0x2a = * (asterisk) = REAL BUG')
print('0x60 = backtick = CORRECT template literal')
