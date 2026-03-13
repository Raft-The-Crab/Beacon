/**
 * BEACON SERVER - RAILWAY ENTRYPOINT
 * Optimized for Railway.app with horizontal scaling support.
 *
 * Self-ping every 3 minutes to prevent Railway's 15-minute inactivity timeout.
 * (Railway free/hobby tier sleeps after 15 min with no inbound traffic.)
 */
'use strict';

const https = require('https');
const http  = require('http');

console.log('🚀 Beacon Railway Server (API + WS) is starting up...');

require('./dist/src/api-server.js');
require('./dist/src/ws-server.js');

// ─── Self-ping to keep Railway alive ─────────────────────────────────────────
// Railway provides RAILWAY_PUBLIC_DOMAIN or we fall back to the Railway-injected
// PORT to build a localhost ping. Runs every 3 minutes (well under the 15-min
// inactivity cutoff).
const PING_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

function buildPingUrl() {
  const domain = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.RAILWAY_STATIC_URL;
  if (domain) {
    // Use the public HTTPS URL Railway assigns to the service
    const base = domain.startsWith('http') ? domain : `https://${domain}`;
    return `${base}/api/health`;
  }
  // Fallback: ping ourselves on localhost
  const port = process.env.PORT || 8080;
  return `http://localhost:${port}/api/health`;
}

function selfPing() {
  const url = buildPingUrl();
  const lib = url.startsWith('https') ? https : http;

  const req = lib.get(url, (res) => {
    console.log(`[keep-alive] ping → ${url} (${res.statusCode})`);
    res.resume(); // drain the response
  });

  req.on('error', (err) => {
    // Non-fatal — server may still be booting
    console.warn(`[keep-alive] ping failed: ${err.message}`);
  });

  req.setTimeout(10000, () => {
    req.destroy();
  });
}

// Start pinging after a 30-second warm-up delay so the server has time to bind
setTimeout(() => {
  selfPing();
  setInterval(selfPing, PING_INTERVAL_MS);
}, 30 * 1000);

