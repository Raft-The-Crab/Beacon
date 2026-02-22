import { prisma } from '../db'

/**
 * E2EEService
 * Handles public key management and encrypted message routing
 */
export class E2EEService {
    /**
     * Update a user's public key for E2EE
     */
    static async updatePublicKey(userId: string, publicKey: string, salt: string) {
        return await prisma.user.update({
            where: { id: userId },
            data: {
                publicKey,
                deviceSalt: salt
            }
        });
    }

    /**
     * Retrieve a user's public key
     */
    static async getPublicKey(userId: string): Promise<{ publicKey: string | null, salt: string | null }> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { publicKey: true, deviceSalt: true }
        });
        return {
            publicKey: user?.publicKey || null,
            salt: user?.deviceSalt || null
        };
    }

    /**
     * Broadcast an encrypted message payload
     */
    static async routeEncryptedMessage(senderId: string, recipientId: string, payload: { encryptedContent: string, nonce: string }) {
        console.log(`[E2EE] Routing encrypted message from ${senderId} to ${recipientId}`);
        // Validation and routing logic (typically used in DMs)
        // Ensure recipient has a public key registered
        const { publicKey } = await this.getPublicKey(recipientId);
        if (!publicKey) {
            throw new Error('Recipient does not have E2EE enabled.');
        }

        return payload;
    }
}
