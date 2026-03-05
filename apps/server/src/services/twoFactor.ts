import node2fa from 'node-2fa'
import QRCode from 'qrcode'
import { prisma } from '../db'

export class TwoFactorService {
    /**
     * Generates a new TOTP secret for a user
     */
    static generateSecret(email: string) {
        const result = node2fa.generateSecret({
            name: 'Beacon',
            account: email
        })
        return {
            base32: result.secret,
            otpauth_url: result.uri
        }
    }

    /**
     * Generates a QR code data URL for the TOTP secret
     */
    static async generateQRCode(otpauthUrl: string) {
        return await QRCode.toDataURL(otpauthUrl)
    }

    /**
     * Verifies a TOTP token against a secret
     */
    static verifyToken(secret: string, token: string): boolean {
        const result = node2fa.verifyToken(secret, token, 1) // 1 window tolerance
        return result !== null
    }

    /**
     * Enables 2FA for a user after successful verification
     */
    static async enableForUser(userId: string, secret: string) {
        return await prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: true,
                twoFactorSecret: secret
            }
        })
    }

    /**
     * Disables 2FA for a user
     */
    static async disableForUser(userId: string) {
        return await prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null
            }
        })
    }
}
