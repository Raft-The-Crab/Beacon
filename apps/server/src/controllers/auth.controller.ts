import express from 'express';
import { AuthService, RegisterSchema, LoginSchema } from '../services/auth';
import { prisma } from '../db';
import { SystemAuditService, AuditAction } from '../services/systemAudit';
import { NotificationService } from '../services/notification';
import { logger } from '../services/logger';
import { getFingerprint, hashFingerprint } from '../middleware/security';

type Request = express.Request;
type Response = express.Response;

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MIN = 15;

/** Centralized cookie config — eliminates 8x duplication across auth handlers */
function getCookieConfig(req: Request) {
    const isLocalhost = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
    const secure = process.env.NODE_ENV === 'production' && !isLocalhost;
    const sameSite: 'none' | 'lax' = secure ? 'none' : 'lax';
    return { httpOnly: true, secure, sameSite, path: '/' } as const;
}

/** Sets access + refresh token cookies on the response */
function setAuthCookies(res: Response, req: Request, accessToken: string, refreshToken?: string) {
    const base = getCookieConfig(req);
    const fpHash = hashFingerprint(req);
    
    res.cookie('token', accessToken, { ...base, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.cookie('sid_sig', fpHash, { ...base, maxAge: 7 * 24 * 60 * 60 * 1000 });
    
    if (refreshToken) {
        res.cookie('refreshToken', refreshToken, { ...base, maxAge: 30 * 24 * 60 * 60 * 1000 });
    }
}

function isDatabaseUnavailable(error: unknown): boolean {
    if (!prisma) return true;
    const message = error instanceof Error ? error.message : String(error);
    const isUnavailable = /database not available|can't reach database|failed to connect|prisma|timeout|pool/i.test(message);
    if (isUnavailable) {
        logger.error(`[AUTH] Database connection error detected: ${message}`);
    }
    return isUnavailable;
}

export class AuthController {
    static async register(req: Request, res: Response) {
        try {
            const data = RegisterSchema.parse(req.body);
            const result = await AuthService.register(data);

            if (result.verificationRequired) {
                return res.status(200).json({
                    message: 'Registration successful. Please check your email for a verification code.',
                    verificationRequired: true,
                    email: result.user.email
                });
            }

            // Fallback path for social login or future flows that bypass verification
            if ((result as any).accessToken) {
                setAuthCookies(res, req, (result as any).accessToken, (result as any).refreshToken);
            }

            await SystemAuditService.log({
                action: AuditAction.USER_LOGIN_SUCCESS,
                userId: result.user.id,
                reason: 'New account registered',
                ip: req.ip,
                userAgent: req.headers['user-agent'] as string
            });

            res.json(result);
        } catch (error: any) {
            logger.error(`[AUTH] Register error: ${error.message}`, error);
            if (isDatabaseUnavailable(error)) {
                return res.status(503).json({ error: 'Authentication service unavailable. Check the database connection.' });
            }
            res.status(400).json({ error: error.message || 'Registration failed' });
        }
    }

    static async login(req: Request, res: Response) {
        try {
            const data = LoginSchema.parse(req.body);
            const userForLockout = await (prisma.user as any).findFirst({
                where: {
                    OR: [
                        { email: { equals: data.identifier, mode: 'insensitive' } },
                        { username: { equals: data.identifier, mode: 'insensitive' } }
                    ]
                },
                select: { id: true, loginAttempts: true, lockoutUntil: true }
            });

            if (userForLockout?.lockoutUntil && userForLockout.lockoutUntil > new Date()) {
                const waitMinutes = Math.ceil(((userForLockout.lockoutUntil as Date).getTime() - Date.now()) / 60000);
                return res.status(403).json({ 
                    error: `Account is temporarily locked. Please try again in ${waitMinutes} minutes.` 
                });
            }

            const result = await AuthService.login(data);

            if (result.verificationRequired) {
                return res.status(200).json({
                    message: 'Account not verified. Please verify your email.',
                    verificationRequired: true,
                    email: result.email
                });
            }

            // Successful login — reset lockout counters
            if (userForLockout?.id) {
                await (prisma.user as any).update({
                    where: { id: userForLockout.id },
                    data: { loginAttempts: 0, lockoutUntil: null }
                });
            }

            if (!('mfaRequired' in result) && !('verificationRequired' in result) && (result as any).accessToken) {
                // Ensure we use the proper tokens with fingerprint
                const fpHash = hashFingerprint(req);
                const userId = (result as any).user.id;
                const tokens = AuthService.generateTokenPair(userId, fpHash);
                setAuthCookies(res, req, tokens.accessToken, tokens.refreshToken);
                (result as any).accessToken = tokens.accessToken;
                (result as any).refreshToken = tokens.refreshToken;
            }

            res.json(result);
        } catch (error: any) {
            logger.error(`[AUTH] Login error: ${error.message}`);

            if (isDatabaseUnavailable(error)) {
                return res.status(503).json({ error: 'Authentication service unavailable. Check the database connection.' });
            }

            // Increment failed login attempts for lockout
            try {
                const identifier = req.body?.identifier;
                if (identifier && prisma) {
                    const failedUser = await (prisma.user as any).findFirst({
                        where: {
                            OR: [
                                { email: { equals: identifier, mode: 'insensitive' } },
                                { username: { equals: identifier, mode: 'insensitive' } }
                            ]
                        },
                        select: { id: true, loginAttempts: true }
                    });

                    if (failedUser) {
                        const newAttempts = (failedUser.loginAttempts || 0) + 1;
                        const updateData: any = { loginAttempts: newAttempts };

                        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
                            updateData.lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MIN * 60 * 1000);
                        }

                        await (prisma.user as any).update({
                            where: { id: failedUser.id },
                            data: updateData
                        });
                    }
                }
            } catch (lockoutErr: any) {
                logger.warn(`[AUTH] Failed to update lockout counter: ${lockoutErr.message}`);
            }

            res.status(401).json({ error: error.message || 'Invalid credentials' });
        }
    }

    static async verify(req: Request, res: Response) {
        try {
            const { email, code } = req.body;
            if (!email || !code) return res.status(400).json({ error: 'Email and code required' });

            const result = await AuthService.verifyEmail(email, code);
            const fpHash = hashFingerprint(req);
            const tokens = AuthService.generateTokenPair(result.user.id, fpHash);
            setAuthCookies(res, req, tokens.accessToken, tokens.refreshToken);
            
            result.accessToken = tokens.accessToken;
            result.refreshToken = tokens.refreshToken;

            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message || 'Verification failed' });
        }
    }

    static async resendVerification(req: Request, res: Response) {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ error: 'Email required' });

            const result = await AuthService.resendVerification(email);
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message || 'Failed to resend code' });
        }
    }

    static async getMe(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });
            if (!prisma) return res.status(503).json({ error: 'User service unavailable.' });

            const user = await (prisma.user as any).findUnique({
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

            if (result.accessToken) {
                const fpHash = hashFingerprint(req);
                const tokens = AuthService.generateTokenPair(result.user.id, fpHash);
                setAuthCookies(res, req, tokens.accessToken, tokens.refreshToken);
                result.accessToken = tokens.accessToken;
                result.refreshToken = tokens.refreshToken;
            }

            res.json(result);
        } catch (error: any) {
            res.status(401).json({ error: error.message || 'Verification failed' });
        }
    }

    static async refresh(req: Request, res: Response) {
        try {
            const { refreshToken: bodyToken } = req.body;
            const cookieToken = req.cookies?.refreshToken;
            const refreshToken = bodyToken || cookieToken;

            if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

            const payload = AuthService.verifyRefreshToken(refreshToken);
            if (!payload) return res.status(401).json({ error: 'Invalid or expired refresh token' });

            const fpHash = hashFingerprint(req);
            const tokens = AuthService.generateTokenPair(payload.id, fpHash);
            setAuthCookies(res, req, tokens.accessToken, tokens.refreshToken);

            res.json({
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to refresh token' });
        }
    }

    static async logout(req: Request, res: Response) {
        try {
            const base = getCookieConfig(req);
            res.clearCookie('token', base);
            res.clearCookie('refreshToken', base);
            res.clearCookie('sid_sig', base);
            res.json({ success: true, message: 'Logged out successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to logout' });
        }
    }

    static async getProfilePreview(req: Request, res: Response) {
        try {
            const { identifier } = req.params;
            if (!identifier) return res.status(400).json({ error: 'Identifier required' });

            const cleanIdentifier = decodeURIComponent(identifier).trim();
            const user = await (prisma.user as any).findFirst({
                where: {
                    OR: [
                        { email: { equals: cleanIdentifier, mode: 'insensitive' } },
                        { username: { equals: cleanIdentifier, mode: 'insensitive' } }
                    ]
                },
                select: {
                    username: true,
                    avatar: true,
                    displayName: true,
                    globalName: true
                } as any
            });

            if (!user) {
                return res.status(200).json(null);
            }

            res.status(200).json(user);
        } catch (error) {
            logger.error(`Auth: Profile preview error for ${req.params.identifier}: ${error}`);
            res.status(200).json(null);
        }
    }

    static async forgotPassword(req: Request, res: Response) {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ error: 'Email required' });

            const result = await AuthService.forgotPassword(email);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Internal Server Error' });
        }
    }

    static async resetPassword(req: Request, res: Response) {
        try {
            const result = await AuthService.resetPassword(req.body);
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message || 'Invalid request' });
        }
    }

    static async googleLogin(req: Request, res: Response) {
        try {
            const { idToken } = req.body;
            logger.info(`[GOOGLE_LOGIN] Attempt received. Token length: ${idToken?.length || 0}`);
            
            if (!idToken) {
                logger.warn('[GOOGLE_LOGIN] Missing ID token');
                return res.status(400).json({ error: 'ID Token required' });
            }

            const { admin } = await import('../config/firebase');
            if (!admin.apps.length) {
                const isConfigured = !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
                logger.error(`[GOOGLE_LOGIN] Firebase Admin not initialized (Configured: ${isConfigured})`);
                
                const errorMessage = isConfigured 
                    ? 'Google Login is currently unavailable (Initialization failed). Please check server logs.'
                    : 'Google Login is currently unavailable (Environment variables missing).';

                return res.status(503).json({ 
                    error: errorMessage,
                    code: isConfigured ? 'FIREBASE_INIT_ERROR' : 'FIREBASE_CONFIG_MISSING'
                });
            }

            // 1. Verify ID Token
            logger.info('[GOOGLE_LOGIN] Verifying ID token with Firebase...');
            let decodedToken;
            try {
                decodedToken = await admin.auth().verifyIdToken(idToken);
            } catch (authErr: any) {
                logger.error(`[GOOGLE_LOGIN] Firebase token verification failed: ${authErr.message} (Code: ${authErr.code})`);
                return res.status(401).json({ 
                    error: 'Invalid Google Token', 
                    message: authErr.message,
                    code: authErr.code 
                });
            }

            const { email, name, picture, uid, given_name, family_name, locale } = decodedToken as any;
            logger.info(`[GOOGLE_LOGIN] Decoded token: email=${email}, name=${name}, uid=${uid}`);

            if (!email) {
                logger.warn('[GOOGLE_LOGIN] Email missing in Google token');
                return res.status(400).json({ error: 'Email not provided by Google' });
            }

            // 2. Find or Create User
            logger.info(`[GOOGLE_LOGIN] Looking for user: ${email}`);
            let user = await (prisma.user as any).findUnique({ where: { email } });

            if (!user) {
                logger.info(`[GOOGLE_LOGIN] Creating new user for ${email}`);
                const discriminator = Math.floor(1000 + Math.random() * 9000).toString();
                // Sanitize username — strip non-alphanumeric, enforce length
                const rawName = (email.split('@')[0] || 'user').replace(/[^a-zA-Z0-9_.-]/g, '');
                const username = (rawName + discriminator).substring(0, 32);

                try {
                    user = await (prisma.user as any).create({
                        data: {
                            email,
                            username,
                            displayName: name || `${given_name || ''} ${family_name || ''}`.trim() || email.split('@')[0],
                            avatar: picture || null,
                            discriminator,
                            password: '', // No password for social login users
                            status: 'online',
                            isVerified: true, // Social login bypasses email verification
                            locale: locale || null
                        }
                    });
                    logger.success(`[GOOGLE_LOGIN] New user created: ${user.id}`);
                    
                    // Trigger welcome email asynchronously
                    NotificationService.sendWelcomeEmail(user.email, user.displayName).catch(err => {
                        logger.error(`[GOOGLE_LOGIN] Failed to send welcome email to ${user.email}: ${err.message}`);
                    });
                } catch (dbErr: any) {
                    logger.error(`[GOOGLE_LOGIN] User creation failed: ${dbErr.message}`);
                    return res.status(500).json({ error: 'Failed to create user account' });
                }

                await SystemAuditService.log({
                    action: AuditAction.USER_LOGIN_SUCCESS,
                    userId: user.id,
                    reason: 'New user registered via Google',
                    ip: req.ip,
                    userAgent: req.headers['user-agent'] as string,
                    fingerprint: getFingerprint(req)
                });
            } else {
                logger.info(`[GOOGLE_LOGIN] Existing user logged in: ${user.id}`);
                // Sync metadata
                user = await (prisma.user as any).update({
                    where: { id: user.id },
                    data: {
                        displayName: name || user.displayName,
                        avatar: picture || user.avatar,
                        locale: locale || user.locale || null
                    }
                });
            }

            // 3. Generate Beacon Tokens
            const fpHash = hashFingerprint(req);
            const { accessToken, refreshToken } = AuthService.generateTokenPair(user.id, fpHash);
            setAuthCookies(res, req, accessToken, refreshToken);

            await SystemAuditService.log({
                action: AuditAction.USER_LOGIN_SUCCESS,
                userId: user.id,
                reason: 'Login via Google',
                ip: req.ip,
                userAgent: req.headers['user-agent'] as string,
                fingerprint: getFingerprint(req)
            });

            logger.info(`[GOOGLE_LOGIN] Successful login for user: ${user.id}`);
            res.json({
                user: AuthService.sanitizeUser(user),
                accessToken,
                refreshToken
            });
        } catch (error: any) {
            if (isDatabaseUnavailable(error)) {
                return res.status(503).json({ error: 'Database unavailable. Please try again in a moment.' });
            }
            logger.error(`[GOOGLE_LOGIN] Unexpected fatal error: ${error.stack || error.message}`);
            res.status(500).json({ error: 'Internal Server Error during Google Login' });
        }
    }
}
