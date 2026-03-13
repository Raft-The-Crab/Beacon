const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding Quests...')

    await prisma.quest.deleteMany()

    const quests = [
        // First 3 quests are the active daily set returned by the API.
        // Base total = 150 coins, Beacon+ total = 225 coins (+50%).
        {
            title: 'Chatterbox',
            description: 'Send 20 messages in any server or DM',
            reward: 50,
            total: 20,
            type: 'message'
        },
        {
            title: 'Social Butterfly',
            description: 'Send 40 messages in any server',
            reward: 50,
            total: 40,
            type: 'message'
        },
        {
            title: 'Voice Warmup',
            description: 'Spend 20 minutes in a voice channel',
            reward: 50,
            total: 20,
            type: 'voice'
        },
        {
            title: 'Voice Chat Veteran',
            description: 'Spend 1 hour in voice channels',
            reward: 70,
            total: 60,  // 60 minutes
            type: 'voice'
        },
        // ── Reaction / friend quests ────────────────────────────────────────
        {
            title: 'Emoji Master',
            description: 'Add 10 reactions to messages',
            reward: 25,
            total: 10,
            type: 'reaction'
        },
        {
            title: 'Friend Greeter',
            description: 'Send a DM to a friend',
            reward: 20,
            total: 1,
            type: 'dm'
        },
        // ── Bonus quest (harder) ────────────────────────────────────────────
        {
            title: 'Going Live',
            description: 'Stream for at least 30 minutes',
            reward: 100,
            total: 30,
            type: 'stream'
        },
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
