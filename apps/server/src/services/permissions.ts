import { PermissionBit } from '@beacon/types'
import { prisma, redis } from '../db'

export class PermissionService {
  private static CACHE_TTL = 300 // 5 minutes

  static async hasPermission(
    userId: string,
    guildId: string,
    permission: PermissionBit
  ): Promise<boolean> {
    // Check cache first
    const cacheKey = `perms:${userId}:${guildId}`
    const cached = await redis.get(cacheKey)
    
    let userPermissions: bigint
    
    if (cached) {
      userPermissions = BigInt(cached)
    } else {
      userPermissions = await this.calculatePermissions(userId, guildId)
      await redis.setex(cacheKey, this.CACHE_TTL, userPermissions.toString())
    }

    // Administrator has all permissions
    if ((userPermissions & PermissionBit.ADMINISTRATOR) === PermissionBit.ADMINISTRATOR) {
      return true
    }

    return (userPermissions & permission) === permission
  }

  private static async calculatePermissions(userId: string, guildId: string): Promise<bigint> {
    // Check if user is guild owner
    const guild = await prisma.guild.findUnique({
      where: { id: guildId },
      select: { ownerId: true }
    })

    if (guild?.ownerId === userId) {
      return PermissionBit.ADMINISTRATOR
    }

    // Get user's roles in the guild
    const member = await prisma.guildMember.findUnique({
      where: { userId_guildId: { userId, guildId } },
      include: { roles: true }
    })

    if (!member) return 0n

    // Combine permissions from all roles
    let permissions = 0n
    for (const role of member.roles) {
      permissions |= BigInt(role.permissions)
    }

    return permissions
  }

  static async invalidateCache(userId: string, guildId: string): Promise<void> {
    await redis.del(`perms:${userId}:${guildId}`)
  }
}
