/**
 * BEACON SERVER - CLAWCLOUD ENTRYPOINT
 * Optimized for ClawCloud with image-only upload restrictions and memory limits.
 */
import './dist/api-server.js';
import './dist/ws-server.js';

console.log('🚀 Beacon ClawCloud Server is starting up...');
console.log('⚠️  Note: ClawCloud instance configured for Image Uploads only.');
