import { z } from 'zod';

export const activationTokenParamSchema = z.object({
  token: z.string().min(1),
});

export const activateAccountSchema = z.object({
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caracteres'),
});

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caracteres'),
});

export const resetTokenParamSchema = z.object({
  token: z.string().min(1),
});

export type ActivateAccountInput = z.infer<typeof activateAccountSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
