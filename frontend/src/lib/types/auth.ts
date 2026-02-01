export type UserRole = 'ADMIN' | 'AVOCAT' | 'COLLABORATEUR' | 'SECRETAIRE';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  cabinetId: string;
  twoFactorEnabled: boolean;
  phone?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface TwoFactorRequiredResponse {
  success: boolean;
  data: {
    requiresTwoFactor: true;
    tempToken: string;
  };
}

export interface RegisterResponse {
  success: boolean;
  data: {
    cabinet: {
      id: string;
      name: string;
      email: string;
    };
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    };
  };
}

export interface TwoFactorSetupResponse {
  success: boolean;
  data: {
    secret: string;
    qrCode: string;
  };
}
