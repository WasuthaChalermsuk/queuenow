
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf-8');
const id = env.match(/LINE_CHANNEL_ID[= ]+(.+)/);
const secret = env.match(/LINE_CHANNEL_SECRET[= ]+(.+)/);
const token = env.match(/LINE_CHANNEL_ACCESS_TOKEN[= ]+(.+)/);
console.log(id ? id[1].trim().replace(/"/g, '') : 'NOT_FOUND');
console.log(secret ? secret[1].trim().replace(/"/g, '') : 'NOT_FOUND');
console.log(token ? token[1].trim().replace(/"/g, '') : 'NOT_FOUND');
