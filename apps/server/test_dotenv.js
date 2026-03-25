const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envConfig = dotenv.parse(fs.readFileSync(path.join(__dirname, '.env')));
const rawKey = envConfig.FIREBASE_PRIVATE_KEY;

console.log("rawKey stringification:", JSON.stringify(rawKey));

function sanitizePrivateKey(key) {
    if (!key) return null;
    let sanitized = key.trim();
    if ((sanitized.startsWith('"') && sanitized.endsWith('"')) ||
        (sanitized.startsWith("'") && sanitized.endsWith("'"))) {
        sanitized = sanitized.slice(1, -1);
    }
    sanitized = sanitized.replace(/\\n/g, '\n');
    const header = '-----BEGIN PRIVATE KEY-----';
    const footer = '-----END PRIVATE KEY-----';
    const core = sanitized
        .replace(header, '')
        .replace(footer, '')
        .replace(/\s+/g, '');
    const wrappedCore = core.match(/.{1,64}/g)?.join('\n') || core;
    const finalKey = `${header}\n${wrappedCore}\n${footer}\n`;
    console.log("FINAL KEY:\n" + finalKey);
    return finalKey;
}

try {
    const key = sanitizePrivateKey(rawKey);
    const parsed = crypto.createPrivateKey(key);
    console.log("SUCCESS");
} catch(err) {
    console.error("FAIL:", err.message);
}
