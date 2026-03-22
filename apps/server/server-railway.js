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
if (process.env.RAILWAY_GIT_COMMIT_SHA) {
  console.log(`[Railway] Deploy commit: ${process.env.RAILWAY_GIT_COMMIT_SHA}`);
}

const envPresence = {
  DATABASE_URL: !!process.env.DATABASE_URL,
  MONGO_URI: !!process.env.MONGO_URI,
  REDIS_URL_PRIVATE: !!process.env.REDIS_URL_PRIVATE,
  REDIS_URL_PUBLIC: !!process.env.REDIS_URL_PUBLIC,
  AUTO_TUNE_PROFILE: process.env.AUTO_TUNE_PROFILE || '(unset)',
};
console.log('[Railway] Env presence:', envPresence);

// Railway should stay lightweight by default.
if (process.env.ENABLE_BOT_SYSTEM == null) process.env.ENABLE_BOT_SYSTEM = 'false';
if (process.env.ENABLE_IMAGE_MODERATION == null) process.env.ENABLE_IMAGE_MODERATION = 'false';
if (process.env.ENABLE_MODERATION == null) process.env.ENABLE_MODERATION = 'true';
if (process.env.AUTO_TUNE_PROFILE == null) process.env.AUTO_TUNE_PROFILE = 'railway-api';

const apiPath = path.join(__dirname, 'dist', 'src', 'api-server.js');

if (!fs.existsSync(apiPath)) {
  console.error('[Railway] Missing build output: dist/src/api-server.js');
  console.error('   Run npm run build before npm run start:railway');
  process.exit(1);
}

// Require the unified server (API + WebSocket)
require(apiPath);
console.log('[Railway] Unified Beacon Server (API + Gateway) loaded');

const PING_INTERVAL_MS = 3 * 60 * 1000;

function buildPingUrl() {
  // Keepalive is process-local in Railway to avoid ingress path/proxy mismatches.
  const port = process.env.PORT || 8080;
  return `http://localhost:${port}/api/version`;
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
