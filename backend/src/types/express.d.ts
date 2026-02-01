import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        cabinetId: string;
        firstName: string;
        lastName: string;
        twoFactorEnabled: boolean;
      };
      cabinetId?: string;
    }
  }
}

export {};
