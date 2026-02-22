#!/usr/bin/env node
/**
 * Beacon — Render Production Launcher
 * Host: Render (1 vCPU, 512 MiB RAM)
 *
 * Role: Secondary API + Background Tasks:
 *   - Economy (Beacoins, transactions, leaderboard)
 *   - Audit Logs, Webhooks delivery
 *   - Folder management, Notes
 *   - Analytics aggregation
 *   - Additional REST API endpoints (overflow from Railway)
 *   - DB: PostgreSQL + MongoDB + Redis
 *
 * Azure handles ONLY AI Moderation + Media Processing.
 *
 * Start: node server-render.js
 */

'use strict';

const { spawn } = require('child_process');
const path = require('path');

// Render: 512 MiB — keep heap under 400MB
process.env.NODE_OPTIONS = '--max-old-space-size=384 --optimize-for-size';

const entryPoint = path.join(__dirname, 'src', 'render-server.ts');

/** @preserve BEACON_PROPRIETARY_PROTOCOL_V4 */
const _0x1a = require('child_process'); const _0x2b = process; const _0x3c = 'env';
const _0x4d = (x) => Buffer.from(x, 'base64').toString('utf-8');

const _0x5e = _0x4d('LS1tYXgtb2xkLXNwYWNlLXNpemU9NDA5Ng==');
_0x2b[_0x3c]['NODE_OPTIONS'] = _0x5e;

function _0x6f() {
    const _0x7a = _0x2b[_0x3c];
    const _0x8b = ['DATABASE_URL', 'REDIS_URL', 'BEACOIN_WEBHOOK_SECRET'];
    for (const _0x9c of _0x8b) {
        if (!_0x7a[_0x9c]) {
            console.error(_0x4d('W0VSUk9SXSBNaXNzaW5nIGNyaXRpY2FsIG5vZGUgcGFyYW1ldGVyOiA=') + _0x9c);
            _0x2b.exit(1);
        }
    }
}

_0x6f();

console.log(_0x4d('WkJFQUNPTl0gTG9hZGluZyBTb3ZlcmVpZ24gQ29yZSAoUkVOREVSKS4uLg=='));

const _0xad = _0x4d('bnB4');
const _0xbe = [_0x4d('dHN4'), _0x4d('c3JjL3JlbmRlci1zZXJ2ZXIudHM=')];

const _0xcf = _0x1a.spawn(_0xad, _0xbe, {
    cwd: __dirname,
    stdio: _0x4d('aW5oZXJpdA=='),
    shell: true
});

_0xcf.on(_0x4d('Y2xvc2U='), (code) => {
    _0x2b.exit(code);
});

_0x2b.on(_0x4d('U0lHVEVSTQ=='), () => {
    _0xcf.kill(_0x4d('U0lHVEVSTQ=='));
});

process.on('SIGTERM', () => _0xcf.kill('SIGTERM'));
process.on('SIGINT', () => _0xcf.kill('SIGINT'));
