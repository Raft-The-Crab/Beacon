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
}
