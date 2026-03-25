import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function initSystemBot() {
  const SYSTEM_BOT_ID = 'BEACON_SYSTEM_BOT';
  
  try {
    const bot = await prisma.user.upsert({
      where: { id: SYSTEM_BOT_ID },
      update: {
        username: 'Beacon Bot',
        bot: true,
        isOfficial: true,
        isVerified: true,
        status: 'online',
      },
      create: {
        id: SYSTEM_BOT_ID,
        username: 'Beacon Bot',
        email: 'system-bot@beacon.qzz.io',
        password: 'SYSTEM_BOT_NO_LOGIN_' + Math.random(),
        bot: true,
        isOfficial: true,
        isVerified: true,
        status: 'online',
        systemSettings: { tipsEnabled: true }
      },
    });
    console.log(`[INIT] System Bot initialized: ${bot.username} (${bot.id})`);
  } catch (err) {
    console.error(`[INIT] Failed to initialize system bot:`, err);
  } finally {
    await prisma.$disconnect();
  }
}

initSystemBot();
