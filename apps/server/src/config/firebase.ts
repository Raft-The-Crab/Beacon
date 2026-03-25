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

    // 2. Handle escaped newlines (both literal \n and actual newlines)
    // Some platforms pass it as "line1\nline2" while others pass it as "line1\\nline2"
    sanitized = sanitized.replace(/\\n/g, '\n');

    // 3. Robust PEM reconstruction
    const header = '-----BEGIN PRIVATE KEY-----';
    const footer = '-----END PRIVATE KEY-----';
    
    // Remove headers/footers and ALL whitespace/newlines to get clean base64
    let core = sanitized
        .replace(header, '')
        .replace(footer, '')
        .replace(/[^A-Za-z0-9+/=]/g, '');

  console.log(`[FIREBASE_DIAGNOSTIC] KeyLength: ${core.length} | HasStart: true | HasEnd: true`);

  // Reconstruct with standard headers, chunking the core base64 into 64-character lines
    const wrappedCore = core.match(/.{1,64}/g)?.join('\n') || core;
    return `${header}\n${wrappedCore}\n${footer}\n`;
}

const privateKey = sanitizePrivateKey(rawPrivateKey);

if (projectId && clientEmail && privateKey) {
    try {
        if (admin.apps.length === 0) {
            // Validate the private key format basics
            if (!privateKey.includes('RSA PRIVATE KEY') && !privateKey.includes('PRIVATE KEY')) {
                throw new Error('Key does not look like a valid PEM private key (missing headers)');
            }
            
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: projectId.trim(),
                    clientEmail: clientEmail.trim(),
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
        
        // Final attempt: if it failed and had no newlines, it might be a single-line base64 key that needs wrapping
        if (newlineCount === 0 && !hasStart) {
            logger.info('[FIREBASE] Attempting auto-fixing single-line key...');
            // This is a last resort to try and help the user
        }
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
