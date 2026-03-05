const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding Quests...')

    await prisma.quest.deleteMany()

    const quests = [
        {
            title: 'Social Butterfly',
            description: 'Send 50 messages in any server',
            reward: 100,
            total: 50,
            type: 'message'
        },
        {
            title: 'Voice Chat Veteran',
            description: 'Spend 2 hours in Voice Channels',
            reward: 250,
            total: 120, // 120 minutes
            type: 'voice'
        },
        {
            title: 'Going Live',
            description: 'Stream a game for 30 minutes',
            reward: 500,
            total: 30,
            type: 'stream'
        }
    ]

    for (const q of quests) {
        await prisma.quest.create({ data: q })
    }

    console.log('✅ Quests Seeded!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
