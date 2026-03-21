import * as admin from 'firebase-admin';
import { logger } from '../services/logger';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (projectId && clientEmail && privateKey) {
  try {
    if (admin.apps.length === 0) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        logger.success('[FIREBASE] Admin SDK initialized successfully');
      } catch (error: any) {
        logger.error(`[FIREBASE] Admin SDK initialization failed: ${error.message}`);
      }
    }
  } catch (error) {
    logger.error('[FIREBASE] Admin SDK initialization failed', error);
  }
} else {
  const missing = [];
  if (!projectId) missing.push('PROJECT_ID');
  if (!clientEmail) missing.push('CLIENT_EMAIL');
  if (!privateKey) missing.push('PRIVATE_KEY');
  logger.warn(`[FIREBASE] Configuration missing (${missing.join(', ')}). Google Login will be disabled.`);
}

export { admin };
