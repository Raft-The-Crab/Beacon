import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { prisma } from '../db'

export class TwoFactorService {
    /**
     * Generates a new TOTP secret for a user
     */
    static generateSecret(email: string) {
        return speakeasy.generateSecret({
            name: `Beacon (${email})`,
            issuer: 'Beacon'
        })
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
    static verifyToken(secret: string, token: string) {
        return speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token,
            window: 1 // Allow 30 seconds clock skew
        })
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
