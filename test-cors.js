const https = require('https');

// Test 1: Basic health check (no CORS, just see if backend is alive)
function testHealth() {
  return new Promise((resolve) => {
    const req = https.get('https://beacon-v1-api.up.railway.app/api/version', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`[HEALTH] Status: ${res.statusCode}`);
        console.log(`[HEALTH] Body: ${data.substring(0, 200)}`);
        resolve(res.statusCode);
      });
    });
    req.on('error', e => { console.error(`[HEALTH] Error: ${e.message}`); resolve(0); });
    req.setTimeout(10000, () => { req.destroy(); console.error('[HEALTH] Timeout'); resolve(0); });
  });
}

// Test 2: CORS preflight (OPTIONS request with Origin header)
function testCORS() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'beacon-v1-api.up.railway.app',
      port: 443,
      path: '/api/csrf-token',
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://beacon.qzz.io',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'content-type'
      }
    };
    const req = https.request(options, (res) => {
      console.log(`\n[CORS] Status: ${res.statusCode}`);
      console.log(`[CORS] Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin'] || 'MISSING'}`);
      console.log(`[CORS] Access-Control-Allow-Methods: ${res.headers['access-control-allow-methods'] || 'MISSING'}`);
      console.log(`[CORS] Access-Control-Allow-Credentials: ${res.headers['access-control-allow-credentials'] || 'MISSING'}`);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (data) console.log(`[CORS] Body: ${data.substring(0, 200)}`);
        resolve(res.statusCode);
      });
    });
    req.on('error', e => { console.error(`[CORS] Error: ${e.message}`); resolve(0); });
    req.setTimeout(10000, () => { req.destroy(); console.error('[CORS] Timeout'); resolve(0); });
    req.end();
  });
}

async function main() {
  console.log('=== Railway Backend Diagnostic ===');
  console.log(`Time: ${new Date().toISOString()}\n`);
  
  const health = await testHealth();
  const cors = await testCORS();
  
  console.log('\n=== Summary ===');
  if (health === 200) {
    console.log('✅ Backend is ALIVE and responding');
  } else if (health === 502) {
    console.log('❌ 502 Bad Gateway - Backend app is NOT running (port mismatch or crash)');
  } else {
    console.log(`⚠️  Unexpected status: ${health}`);
  }
  
  if (cors === 204 || cors === 200) {
    console.log('✅ CORS preflight PASSED');
  } else {
    console.log(`❌ CORS preflight FAILED (status ${cors})`);
  }
}

main();
