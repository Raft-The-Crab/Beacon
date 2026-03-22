import * as admin from 'firebase-admin';
import { logger } from '../services/logger';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

function sanitizePrivateKey(key: string | undefined): string | null {
    if (!key) return null;

    let sanitized = key.trim();

    // 1. Remove wrapping quotes (common in .env/Railway)
    if ((sanitized.startsWith('"') && sanitized.endsWith('"')) ||
        (sanitized.startsWith("'") && sanitized.endsWith("'"))) {
        sanitized = sanitized.slice(1, -1);
    }

    // 2. Handle escaped newlines (e.g., actual characters \ and n)
    sanitized = sanitized.replace(/\\n/g, '\n');

    // 3. Ensure it has the headers if they are missing but the key content is there
    // Note: Some platforms strip them or they get lost in copy-paste
    if (!sanitized.includes('-----BEGIN PRIVATE KEY-----')) {
        sanitized = `-----BEGIN PRIVATE KEY-----\n${sanitized}`;
    }
    if (!sanitized.includes('-----END PRIVATE KEY-----')) {
        sanitized = `${sanitized}\n-----END PRIVATE KEY-----\n`;
    }

    return sanitized;
}

const privateKey = sanitizePrivateKey(rawPrivateKey);

if (projectId && clientEmail && privateKey) {
    try {
        if (admin.apps.length === 0) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
            logger.success(`[FIREBASE] Admin SDK initialized for project: ${projectId}`);
        }
    } catch (error: any) {
        logger.error(`[FIREBASE] Failed to initialize Admin SDK: ${error.message}`);
        // Log a safe hint for debugging (length, headers)
        const hasStart = privateKey.includes('-----BEGIN PRIVATE KEY-----');
        const hasEnd = privateKey.includes('-----END PRIVATE KEY-----');
        const newlineCount = (privateKey.match(/\n/g) || []).length;
        logger.info(`[FIREBASE_DIAGNOSTIC] KeyLength: ${privateKey.length} | HasStart: ${hasStart} | HasEnd: ${hasEnd} | Newlines: ${newlineCount}`);
    }
} else {
    const missing = [];
    if (!projectId) missing.push('FIREBASE_PROJECT_ID');
    if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
    if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');
    
    logger.warn(`[FIREBASE] Missing critical configuration: ${missing.join(', ')}`);
    logger.warn('[FIREBASE] Google Login features will be unavailable.');
}

export { admin };
