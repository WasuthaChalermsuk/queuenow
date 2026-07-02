
with open('src/app/admin/page.tsx', 'rb') as f:
    content = f.read()

# Find Authorization line
idx = content.find(b'Authorization:')
chunk = content[idx:idx+60]
print('BYTES:', chunk)
print('HEX:', chunk.hex())

# Show char by char
for i, b in enumerate(chunk):
    print(f'  [{i}] 0x{b:02x} = {chr(b) if 32 <= b < 127 else "?"}')
