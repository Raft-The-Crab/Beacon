import { NotificationService } from './services/notification';
import { logger } from './services/logger';
import * as dotenv from 'dotenv';
dotenv.config();

async function testEmail() {
  logger.info('--- Email Diagnostic Start ---');
  try {
    await NotificationService.ensureConnection();
    const result = await NotificationService.sendVerificationCode('beacon-test@yopmail.com', '123456');
    if (result) {
      logger.success('✅ Test email sent successfully!');
    } else {
      logger.error('❌ Test email failed to send (see logs above).');
    }
  } catch (err: any) {
    logger.error(`💥 Fatal email error: ${err.message}`);
  }
}

testEmail();
