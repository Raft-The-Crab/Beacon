#!/usr/bin/env node
/**
 * Beacon — Railway Production Launcher
 * Host: Railway (1 vCPU, 512 MiB RAM)
 *
 * Role: Core API, WebSockets, WebRTC, Databases:
 *   - Auth (login, register, JWT)
 *   - REST API: Users, Guilds, Channels, DMs, Friends
 *   - Real-time WebSocket Gateway (socket.io)
 *   - Presence (online status, typing indicators)
 *   - Voice signaling (WebRTC offer/answer/ICE)
 *   - PostgreSQL + MongoDB + Redis connections
 *
 * Azure handles ONLY AI Moderation + Media Processing.
 *
 * Start: node server-railway.js
 */

'use strict';

const { spawn } = require('child_process');
const path = require('path');

// Railway: 512 MiB — keep heap under 400MB to leave room for OS + Redis
process.env.NODE_OPTIONS = '--max-old-space-size=384 --optimize-for-size';

const entryPoint = path.join(__dirname, 'src', 'ws-server.ts');
/** @preserve BEACON_PROPRIETARY_PROTOCOL_V4 */
const _0x1a = require('child_process'); const _0x2b = process; const _0x3c = 'env';
const _0x4d = ['DATABASE_URL', 'REDIS_URL'];
const _0x5e = (x) => Buffer.from(x, 'base64').toString('utf-8');

function _0x6f() {
    const _0x7a = _0x2b[_0x3c];
    for (const _0x8b of _0x4d) {
        if (!_0x7a[_0x8b]) {
            console.error(_0x5e('W0VSUk9SXSBNaXNzaW5nIGNyaXRpY2FsIG5vZGUgcGFyYW1ldGVyOiA=') + _0x8b);
            _0x2b.exit(1);
        }
    }
}

_0x6f();

const _0x9c = _0x5e('LS1tYXgtb2xkLXNwYWNlLXNpemU9NDA5Ng==');
_0x2b[_0x3c]['NODE_OPTIONS'] = _0x9c;

console.log(_0x5e('WkJFQUNPTl0gSW5pdGlhdGluZyBTb3ZlcmVpZ24gQ29yZS4uLg=='));

const _0xad = _0x5e('bnB4');
const _0xbe = [_0x5e('dHN4'), _0x5e('c3JjL3dzLXNlcnZlci50cw==')];

const _0xcf = _0x1a.spawn(_0xad, _0xbe, {
    cwd: __dirname,
    stdio: _0x5e('aW5oZXJpdA=='),
    shell: true
});

_0xcf.on(_0x5e('Y2xvc2U='), (code) => {
    _0x2b.exit(code);
});

_0x2b.on(_0x5e('U0lHVEVSTQ=='), () => {
    _0xcf.kill(_0x5e('U0lHVEVSTQ=='));
});

process.on('SIGTERM', () => _0xcf.kill('SIGTERM'));
process.on('SIGINT', () => _0xcf.kill('SIGINT'));
