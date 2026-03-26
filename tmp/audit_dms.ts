import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function auditDMs() {
    try {
        const channels = await prisma.channel.findMany({
            where: { type: 'DM' },
            include: { recipients: { select: { id: true, username: true } } }
        });

        console.log(`Total DM Channels: ${channels.length}`);
        channels.forEach(ch => {
            const participants = ch.recipients.map(p => `${p.username} (${p.id})`).join(', ');
            console.log(`Channel ${ch.id}: [${participants}]`);
        });

        const systemBot = await prisma.user.findFirst({
            where: { OR: [{ id: 'BEACON_SYSTEM_BOT' }, { username: 'Beacon Bot' }] }
        });

        if (systemBot) {
            console.log(`System Bot found: ${systemBot.username} (${systemBot.id})`);
        } else {
            console.log(`❌ System Bot NOT found in DB!`);
        }

    } catch (e) {
        console.error('Audit failed', e);
    } finally {
        await prisma.$disconnect();
    }
}

auditDMs();
