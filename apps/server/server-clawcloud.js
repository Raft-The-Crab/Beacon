/**
 * BEACON SERVER - CLAWCLOUD ENTRYPOINT
 * Optimized for ClawCloud with image-only upload restrictions and memory limits.
 */
'use strict';

console.log('🚀 Beacon ClawCloud Server is starting up...');
console.log('⚠️  Note: ClawCloud instance configured for Image Uploads only.');

require('./dist/src/api-server.js');
require('./dist/src/ws-server.js');
