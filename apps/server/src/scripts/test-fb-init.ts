import './env';
import { admin } from '../config/firebase';
import { logger } from '../services/logger';

async function test() {
    console.log('Testing Firebase initialization...');
    if (admin.apps.length > 0) {
        logger.success('Test: Firebase Admin SDK initialized!');
        process.exit(0);
    } else {
        logger.error('Test: Firebase Admin SDK failed to initialize.');
        process.exit(1);
    }
}

test();
