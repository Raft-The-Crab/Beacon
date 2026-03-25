import { prisma } from '../db';
import { publishGatewayEvent } from './gatewayPublisher';
import { generateShortId } from '../utils/id';
import { logger } from './logger';

export class SystemBotService {
  private static SYSTEM_BOT_ID = 'BEACON_SYSTEM_BOT';

  /** Ensure the official bot exists with the correct flags */
  static async init() {
    try {
      await (prisma.user as any).upsert({
        where: { id: this.SYSTEM_BOT_ID },
        update: {
          bot: true,
          isOfficial: true,
          isVerified: true,
        },
        create: {
          id: this.SYSTEM_BOT_ID,
          username: 'Beacon Bot',
          email: 'system@beacon.qzz.io',
          password: 'SYSTEM_BOT_NO_LOGIN_' + Math.random(),
          bot: true,
          isOfficial: true,
          isVerified: true,
          status: 'online',
        },
      });
      logger.success('[SystemBot] Official Beacon Bot stabilized.');
      this.startScheduler();
    } catch (err) {
      logger.error('[SystemBot] Initialization failed:', err);
    }
  }

  /** Send a system DM to a user */
  static async sendSystemDM(userId: string, content: string, embeds: any[] = []) {
    try {
      // 1. Find or create DM channel
      let channel = await prisma.channel.findFirst({
        where: {
          type: 'DM',
          AND: [
            { recipients: { some: { id: this.SYSTEM_BOT_ID } } },
            { recipients: { some: { id: userId } } }
          ]
        }
      });

      if (!channel) {
        channel = await prisma.channel.create({
          data: {
            id: generateShortId('c', 12),
            name: '',
            type: 'DM',
            recipients: {
              connect: [{ id: this.SYSTEM_BOT_ID }, { id: userId }]
            }
          }
        });
      }

      // 2. Create message
      const message = await (prisma.message as any).create({
        data: {
          content,
          channelId: channel.id,
          authorId: this.SYSTEM_BOT_ID,
          embeds: embeds,
        },
        include: {
          author: { select: { id: true, username: true, isOfficial: true, bot: true, avatar: true } }
        }
      });

      // 3. Broadcast
      await publishGatewayEvent('MESSAGE_CREATE', message);
      return message;
    } catch (err) {
      logger.error(`[SystemBot] Failed to send DM to ${userId}:`, err);
      return null;
    }
  }

  /** Account Security Alert */
  static async notifySecurityAlert(userId: string, reason: string) {
    return this.sendSystemDM(userId, `🔒 **Security Alert**: ${reason}. If this wasn't you, please change your password immediately.`);
  }

  /** Welcome Message */
  static async notifyWelcome(userId: string, username: string) {
    return this.sendSystemDM(userId, `👋 **Welcome to Beacon, ${username}!** I'm your system assistant. I'll keep you updated on security and platform news. You can't reply to me, but I'm always here to help!`);
  }

  /** Random Tips */
  static async sendTip(userId: string) {
    const tips = [
      "💡 Tip: You can use `/help` in any server to see available commands!",
      "💡 Tip: Beacon Sovereignty means your data belongs to you. Check your privacy settings anytime.",
      "💡 Tip: Level up your server with Beacoins to unlock vanity URLs and higher bitrates!",
      "💡 Tip: You can customize your profile with effects and decorations in the Shop.",
      "💡 Tip: Want to automate your server? Use webhooks to post updates from GitHub or other services!"
    ];
    const tip = tips[Math.floor(Math.random() * tips.length)];
    return this.sendSystemDM(userId, tip);
  }

  /** Periodic scheduler for tips and updates */
  static startScheduler() {
    // Send a tip to a few random online users every 6 hours
    setInterval(async () => {
      try {
        const onlineUsers = await (prisma.user as any).findMany({
          where: {
            status: 'online',
            bot: false,
          },
          take: 10
        });

        for (const user of onlineUsers) {
          const settings = ((user as any).systemSettings || {}) as any;
          if (settings.tipsEnabled !== false) {
            await this.sendTip(user.id);
          }
        }
      } catch (err) {
        logger.error('[SystemBot] Scheduler cycle failed:', err);
      }
    }, 6 * 60 * 60 * 1000); // 6 hours
  }
}
