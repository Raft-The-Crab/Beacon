const https = require('https');
const options = {
  hostname: 'beacon-v1-api.up.railway.app',
  port: 443,
  path: '/health',
  method: 'GET'
};
const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('BODY:', data));
});
req.on('error', (e) => console.error(e));
req.end();
