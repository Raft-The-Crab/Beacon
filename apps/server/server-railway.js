/**
 * BEACON SERVER - RAILWAY ENTRYPOINT
 * Optimized for Railway.app with horizontal scaling support.
 */
'use strict';

console.log('🚀 Beacon Railway Server (API + WS) is starting up...');

require('./dist/src/api-server.js');
require('./dist/src/ws-server.js');
