/**
 * BEACON SERVER - RAILWAY ENTRYPOINT
 *
 * Railway runs the smaller Node API service.
 * WS stays off by default so this service remains lightweight.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

console.log('[Railway] Beacon API service starting...');

const apiPath = path.join(__dirname, 'dist', 'src', 'api-server.js');
const wsPath = path.join(__dirname, 'dist', 'src', 'ws-server.js');

if (!fs.existsSync(apiPath)) {
  console.error('[Railway] Missing build output: dist/src/api-server.js');
  console.error('   Run npm run build before npm run start:railway');
  process.exit(1);
}

require(apiPath);

if (process.env.ENABLE_WS_SERVER === 'true') {
  if (!fs.existsSync(wsPath)) {
    console.error('[Railway] ENABLE_WS_SERVER=true but dist/src/ws-server.js is missing.');
    process.exit(1);
  }
  require(wsPath);
  console.log('[Railway] WS server enabled in the same process');
} else {
  console.log('[Railway] WS server disabled; running API-only mode');
}

const PING_INTERVAL_MS = 3 * 60 * 1000;

function buildPingUrl() {
  const domain = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.RAILWAY_STATIC_URL;
  if (domain) {
    const base = domain.startsWith('http') ? domain : `https://${domain}`;
    return `${base}/health`;
  }

  const port = process.env.PORT || 8080;
  return `http://localhost:${port}/health`;
}

function selfPing() {
  const url = buildPingUrl();
  const lib = url.startsWith('https') ? https : http;

  const req = lib.get(url, (res) => {
    console.log(`[Railway] keep-alive ping ${url} (${res.statusCode})`);
    res.resume();
  });

  req.on('error', (err) => {
    console.warn(`[Railway] keep-alive ping failed: ${err.message}`);
  });

  req.setTimeout(10000, () => {
    req.destroy();
  });
}

setTimeout(() => {
  selfPing();
  setInterval(selfPing, PING_INTERVAL_MS);
}, 30 * 1000);
