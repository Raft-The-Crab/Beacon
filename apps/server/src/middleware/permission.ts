import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import { hasPermission, computePermissions } from '../utils/permissions';

export function requirePermission(permission: bigint) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?.id;
        const { guildId, channelId } = req.params;
        const targetGuildId = guildId || req.body.guildId;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        if (!targetGuildId) return res.status(400).json({ error: 'Missing guild contextual ID' });

        try {
            const member = await prisma.guildMember.findUnique({
                where: { userId_guildId: { userId, guildId: targetGuildId } },
                include: { roles: true }
            });

            if (!member) return res.status(403).json({ error: 'Not a member of this guild' });

            // Owner override
            const guild = await prisma.guild.findUnique({ where: { id: targetGuildId } });
            if (guild?.ownerId === userId) return next();

            const memberPerms = computePermissions(member.roles.map(r => ({ permissions: BigInt(String(r.permissions)) })));

            if (hasPermission(memberPerms, permission)) {
                return next();
            }

            return res.status(403).json({ error: 'Insufficient permissions' });
        } catch (error) {
            console.error('Permission check error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    };
}
