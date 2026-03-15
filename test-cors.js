const https = require('https');

async function testUrl(name, url, isOptions = false) {
  return new Promise((resolve) => {
    console.log(`[Testing ${name}] -> ${url}`);
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname + parsed.search,
      method: isOptions ? 'OPTIONS' : 'GET',
      headers: {
        'Origin': 'https://beacon.qzz.io',
        'User-Agent': 'Mozilla/5.0 (Diagnostic Script)',
      }
    };
    
    if (isOptions) {
      options.headers['Access-Control-Request-Method'] = 'GET';
      options.headers['Access-Control-Request-Headers'] = 'content-type';
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`[${name}] Status: ${res.statusCode}`);
        console.log(`[${name}] Headers:`, JSON.stringify(res.headers, null, 2));
        if (data.includes('html')) {
           console.log(`[${name}] Body type: HTML (Possibly a proxy error page)`);
        } else {
           console.log(`[${name}] Body: ${data.substring(0, 500)}`);
        }
        resolve(res.statusCode);
      });
    });

    req.on('error', (e) => {
      console.error(`[${name}] Network Error: ${e.message}`);
      resolve(599);
    });

    req.setTimeout(15000, () => {
      console.error(`[${name}] Timeout`);
      req.destroy();
      resolve(598);
    });
    
    if (!isOptions) req.end();
    else req.end();
  });
}

async function run() {
  console.log('=== STARTING DEEP DIAGNOSTIC ===');
  console.log(`Target: https://beacon-v1-api.up.railway.app`);
  
  // 1. Check version (simplest path)
  await testUrl('API_VERSION', 'https://beacon-v1-api.up.railway.app/api/version');
  
  // 2. Check CSRF token (requires CORS)
  await testUrl('API_CORS_GET', 'https://beacon-v1-api.up.railway.app/api/csrf-token');
  
  // 3. Check OPTIONS preflight
  await testUrl('API_CORS_OPTIONS', 'https://beacon-v1-api.up.railway.app/api/csrf-token', true);

  console.log('\n=== DIAGNOSTIC COMPLETE ===');
}

run();
