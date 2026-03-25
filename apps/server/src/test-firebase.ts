import * as dotenv from 'dotenv';
dotenv.config();
import { admin } from './config/firebase';
import { logger } from './services/logger';

async function testFirebase() {
  logger.info('--- Firebase Diagnostic Start ---');
  if (!admin || !admin.apps.length) {
    logger.error('❌ Firebase Admin SDK not initialized.');
    return;
  }
  
  try {
    const listUsers = await admin.auth().listUsers(1);
    logger.success(`✅ Firebase connection successful! Users count: ${listUsers.users.length}`);
  } catch (err: any) {
    logger.error(`❌ Firebase Auth test failed: ${err.message}`);
    if (err.code === 'auth/invalid-credential') {
      logger.info('💡 Hint: The private key or client email might be incorrect.');
    }
  }
}

testFirebase();
