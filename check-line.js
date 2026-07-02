
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf-8');

const id = env.match(/LINE_CHANNEL_ID[= ]+(.+)/);
const secret = env.match(/LINE_CHANNEL_SECRET[= ]+(.+)/);
const token = env.match(/LINE_CHANNEL_ACCESS_TOKEN[= ]+(.+)/);

const idVal = id ? id[1].trim().replace(/"/g, '') : '';
const secretVal = secret ? secret[1].trim().replace(/"/g, '') : '';
const tokenVal = token ? token[1].trim().replace(/"/g, '') : '';

console.log('ID:', idVal.substring(0,8) + '...', '| Numeric:', /^\d+$/.test(idVal));
console.log('Secret:', secretVal.length + ' chars');
console.log('Token:', tokenVal.length + ' chars');

// Try to verify token with LINE API
if (tokenVal.length > 100) {
  const https = require('https');
  const data = JSON.stringify({});
  const req = https.request({
    hostname: 'api.line.me',
    path: '/v2/bot/info',
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + tokenVal, 'Content-Length': data.length }
  }, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      const r = JSON.parse(body);
      if (r.userId) {
        console.log('LINE API: ✅ OK — Bot:', r.displayName, '| ID:', r.userId.substring(0,8) + '...');
      } else {
        console.log('LINE API: ❌', r.message || r.error || body.substring(0,100));
      }
    });
  });
  req.on('error', e => console.log('LINE API: ❌ Connection error:', e.message));
  req.write(data);
  req.end();
} else {
  console.log('LINE API: ⏳ skipped — token too short (' + tokenVal.length + ' chars, need 100+)');
}
