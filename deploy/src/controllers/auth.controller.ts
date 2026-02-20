import { Request, Response } from 'express';
import { AuthService, RegisterSchema, LoginSchema } from '../services/auth';
import { prisma } from '../db';

export class AuthController {
    static async register(req: Request, res: Response) {
        try {
            const data = RegisterSchema.parse(req.body);
            const result = await AuthService.register(data);
            res.json(result);
        } catch (error: any) {
            console.error('Register error:', error);
            res.status(400).json({ error: error.message || 'Registration failed' });
        }
    }

    static async login(req: Request, res: Response) {
        try {
            const data = LoginSchema.parse(req.body);
            const result = await AuthService.login(data);
            res.json(result);
        } catch (error: any) {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    }

    static async getMe(req: Request, res: Response) {
        try {
            // @ts-ignore - user is attached by middleware
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const user = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user) return res.status(404).json({ error: 'User not found' });

            res.json(AuthService.sanitizeUser(user));
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async setup2FA(req: Request, res: Response) {
        try {
            // @ts-ignore
            const userId = req.user?.id;
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) return res.status(404).json({ error: 'User not found' });

            const { TwoFactorService } = await import('../services/twoFactor');
            const secret = TwoFactorService.generateSecret(user.email);
            const qrCode = await TwoFactorService.generateQRCode(secret.otpauth_url!);

            res.json({
                secret: secret.base32,
                qrCode
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to setup 2FA' });
        }
    }

    static async verify2FA(req: Request, res: Response) {
        try {
            // @ts-ignore
            const userId = req.user?.id;
            const { token, secret } = req.body;

            const { TwoFactorService } = await import('../services/twoFactor');
            const isValid = TwoFactorService.verifyToken(secret, token);

            if (isValid) {
                await TwoFactorService.enableForUser(userId, secret);
                res.json({ success: true, message: '2FA enabled successfully' });
            } else {
                res.status(400).json({ error: 'Invalid token' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to verify 2FA' });
        }
    }

    static async disable2FA(req: Request, res: Response) {
        try {
            // @ts-ignore
            const userId = req.user?.id;
            const { token } = req.body;

            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user || !user.twoFactorSecret) return res.status(400).json({ error: '2FA not enabled' });

            const { TwoFactorService } = await import('../services/twoFactor');
            const isValid = TwoFactorService.verifyToken(user.twoFactorSecret, token);

            if (isValid) {
                await TwoFactorService.disableForUser(userId);
                res.json({ success: true, message: '2FA disabled successfully' });
            } else {
                res.status(400).json({ error: 'Invalid token' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to disable 2FA' });
        }
    }

    static async verifyMFA(req: Request, res: Response) {
        try {
            const { userId, token } = req.body;
            if (!userId || !token) return res.status(400).json({ error: 'User ID and token required' });

            const result = await AuthService.verifyMFA(userId, token);
            res.json(result);
        } catch (error: any) {
            res.status(401).json({ error: error.message || 'Verification failed' });
        }
    }
}
