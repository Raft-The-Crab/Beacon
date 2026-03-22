import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; fph?: string; [key: string]: any };
      bot?: any;
      realIp?: string;
    }
  }
}

export {};
