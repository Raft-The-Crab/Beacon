/**
 * BEACON SERVER - CLAWCLOUD ENTRYPOINT
 * Main API deployment. Runs API by default and can also boot WS in the same container.
 */
'use strict';

const fs = require('fs');
const path = require('path');

console.log('[ClawCloud] Beacon main service starting...');

// ClawCloud runs the full feature set by default.
if (process.env.ENABLE_BOT_SYSTEM == null) process.env.ENABLE_BOT_SYSTEM = 'true';
if (process.env.ENABLE_IMAGE_MODERATION == null) process.env.ENABLE_IMAGE_MODERATION = 'true';
if (process.env.ENABLE_MODERATION == null) process.env.ENABLE_MODERATION = 'true';
if (process.env.AUTO_TUNE_PROFILE == null) process.env.AUTO_TUNE_PROFILE = 'clawcloud-api';

const apiPath = path.join(__dirname, 'dist', 'src', 'api-server.js');
const wsPath = path.join(__dirname, 'dist', 'src', 'ws-server.js');

if (!fs.existsSync(apiPath)) {
	console.error('[ClawCloud] Missing build output: dist/src/api-server.js');
	process.exit(1);
}

require(apiPath);

const enableWsServer = process.env.ENABLE_WS_SERVER !== 'false';
if (enableWsServer) {
	if (!fs.existsSync(wsPath)) {
		console.error('[ClawCloud] WS build output is missing: dist/src/ws-server.js');
		process.exit(1);
	}

	require(wsPath);
	console.log('[ClawCloud] WS server enabled in main service');
} else {
	console.log('[ClawCloud] WS server disabled');
}
