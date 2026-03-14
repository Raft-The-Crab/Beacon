import express from 'express';
import { AuthService, RegisterSchema, LoginSchema } from '../services/auth';
import { prisma } from '../db';
import { SystemAuditService, AuditAction } from '../services/systemAudit';

type Request = express.Request;
type Response = express.Response;

function isDatabaseUnavailable(error: unknown): boolean {
    if (!prisma) return true;
    const message = error instanceof Error ? error.message : String(error);
    return /database not available|can't reach database|failed to connect|prisma/i.test(message);
}

export class AuthController {
    static async register(req: Request, res: Response) {
        try {
            const data = RegisterSchema.parse(req.body);
            const result = await AuthService.register(data);

            await SystemAuditService.log({
                action: AuditAction.USER_LOGIN_SUCCESS, // Reuse for register success
                userId: result.user.id,
                reason: 'New account registered',
                ip: req.ip,
                userAgent: req.headers['user-agent'] as string
            });

            res.json(result);
        } catch (error: any) {
            console.error('Register error:', error);
            if (isDatabaseUnavailable(error)) {
                return res.status(503).json({ error: 'Authentication service unavailable. Check the database connection.' });
            }
            res.status(400).json({ error: error.message || 'Registration failed' });
        }
    }

    static async login(req: Request, res: Response) {
        try {
            const data = LoginSchema.parse(req.body);
            const result = await AuthService.login(data);

            await SystemAuditService.log({
                action: AuditAction.USER_LOGIN_SUCCESS,
                userId: result.user?.id,
                ip: req.ip,
                userAgent: req.headers['user-agent'] as string
            });

            res.json(result);
        } catch (error: any) {
            await SystemAuditService.log({
                action: AuditAction.USER_LOGIN_FAILED,
                reason: error.message || 'Invalid credentials',
                metadata: { email: req.body.email },
                ip: req.ip,
                userAgent: req.headers['user-agent'] as string
            });
            if (isDatabaseUnavailable(error)) {
                return res.status(503).json({ error: 'Authentication service unavailable. Check the database connection.' });
            }
            res.status(401).json({ error: 'Invalid credentials' });
        }
    }

    static async getMe(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });
            if (!prisma) return res.status(503).json({ error: 'User service unavailable. Check the database connection.' });

            let user: any = null
            try {
                user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { id: true, username: true, displayName: true, email: true, avatar: true, discriminator: true, badges: true, status: true, customStatus: true }
                });
            } catch (selectError) {
                console.warn('AuthController.getMe full select failed, falling back to minimal profile:', selectError)
                user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { id: true, username: true, displayName: true, email: true, avatar: true, discriminator: true }
                });
                if (user) {
                    user = {
                        ...user,
                        badges: [],
                        status: 'online',
                        customStatus: null,
                    }
                }
            }

            if (!user) return res.status(404).json({ error: 'User not found' });

            res.json(AuthService.sanitizeUser(user));
        } catch (error) {
            if (isDatabaseUnavailable(error)) {
                return res.status(503).json({ error: 'User service unavailable. Check the database connection.' });
            }
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async setup2FA(req: Request, res: Response) {
        try {
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
            const userId = req.user?.id;
            const { token, secret } = req.body;

            const { TwoFactorService } = await import('../services/twoFactor');
            const isValid = TwoFactorService.verifyToken(secret, token);

            if (isValid) {
                await TwoFactorService.enableForUser(userId, secret);

                await SystemAuditService.log({
                    action: AuditAction.USER_MFA_ENABLE,
                    userId,
                    reason: '2FA enabled via setup',
                    ip: req.ip,
                    userAgent: req.headers['user-agent'] as string
                });

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
            const userId = req.user?.id;
            const { token } = req.body;

            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user || !user.twoFactorSecret) return res.status(400).json({ error: '2FA not enabled' });

            const { TwoFactorService } = await import('../services/twoFactor');
            const isValid = TwoFactorService.verifyToken(user.twoFactorSecret, token);

            if (isValid) {
                await TwoFactorService.disableForUser(userId);

                await SystemAuditService.log({
                    action: AuditAction.USER_MFA_DISABLE,
                    userId,
                    reason: '2FA disabled by user',
                    ip: req.ip,
                    userAgent: req.headers['user-agent'] as string
                });

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

    static async refresh(req: Request, res: Response) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

            const payload = AuthService.verifyRefreshToken(refreshToken);
            if (!payload) return res.status(401).json({ error: 'Invalid or expired refresh token' });

            const accessToken = AuthService.generateToken(payload.id);
            const newRefreshToken = AuthService.generateRefreshToken(payload.id);

            res.json({
                accessToken,
                refreshToken: newRefreshToken
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to refresh token' });
        }
    }
}
