import { redis } from '../db'

export async function addGuildMember(guildId: string, userId: string) {
  try {
    await redis.sadd(`guild_members:${guildId}`, userId)
    // Keep a reasonable TTL so stale sets don't accumulate; refreshed on activity
    await redis.expire(`guild_members:${guildId}`, 60 * 60 * 24 * 30)
  } catch (err) {
    console.warn('Failed to add guild member to Redis set', err)
  }
}

export async function removeGuildMember(guildId: string, userId: string) {
  try {
    await redis.srem(`guild_members:${guildId}`, userId)
  } catch (err) {
    console.warn('Failed to remove guild member from Redis set', err)
  }
}

export async function getGuildMembers(guildId: string): Promise<string[] | null> {
  try {
    const members = await redis.smembers(`guild_members:${guildId}`)
    return members && members.length ? members : null
  } catch (err) {
    console.warn('getGuildMembers redis error', err)
    return null
  }
}
