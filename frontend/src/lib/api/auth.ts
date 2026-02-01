import apiClient from './client';
import type {
  LoginResponse,
  TwoFactorRequiredResponse,
  RegisterResponse,
  TwoFactorSetupResponse,
  User,
} from '@/lib/types';

interface LoginResult {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface TwoFactorRequiredResult {
  requiresTwoFactor: true;
  tempToken: string;
}

export async function login(
  email: string,
  password: string
): Promise<LoginResult | TwoFactorRequiredResult> {
  const { data } = await apiClient.post<LoginResponse | TwoFactorRequiredResponse>(
    '/auth/login',
    { email, password }
  );

  if ('requiresTwoFactor' in data.data) {
    return {
      requiresTwoFactor: true,
      tempToken: data.data.tempToken,
    };
  }

  return {
    user: data.data.user,
    accessToken: data.data.accessToken,
    refreshToken: data.data.refreshToken,
    expiresIn: data.data.expiresIn,
  };
}

export async function loginWith2FA(
  email: string,
  password: string,
  code: string
): Promise<LoginResult> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login/2fa', {
    email,
    password,
    code,
  });

  return {
    user: data.data.user,
    accessToken: data.data.accessToken,
    refreshToken: data.data.refreshToken,
    expiresIn: data.data.expiresIn,
  };
}

export async function register(input: {
  cabinetName: string;
  cabinetEmail: string;
  siret?: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}): Promise<RegisterResponse['data']> {
  const { data } = await apiClient.post<RegisterResponse>('/auth/register', input);
  return data.data!;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function refreshTokens(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const { data } = await apiClient.post('/auth/refresh', { refreshToken });
  return data.data!;
}

export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post('/auth/forgot-password', { email });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await apiClient.post('/auth/reset-password', { token, password });
}

export async function verifyEmail(token: string): Promise<void> {
  await apiClient.post('/auth/verify-email', { token });
}

export async function setup2FA(): Promise<TwoFactorSetupResponse['data']> {
  const { data } = await apiClient.post<TwoFactorSetupResponse>('/auth/2fa/setup');
  return data.data!;
}

export async function enable2FA(code: string): Promise<void> {
  await apiClient.post('/auth/2fa/enable', { code });
}

export async function disable2FA(password: string, code: string): Promise<void> {
  await apiClient.post('/auth/2fa/disable', { password, code });
}

export async function getProfile(): Promise<User> {
  const { data } = await apiClient.get<{ success: boolean; data: User }>('/auth/profile');
  return data.data!;
}

export async function updateProfile(input: {
  firstName?: string;
  lastName?: string;
  phone?: string;
}): Promise<User> {
  const { data } = await apiClient.patch<{ success: boolean; data: User }>(
    '/auth/profile',
    input
  );
  return data.data!;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await apiClient.post('/auth/change-password', { currentPassword, newPassword });
}
