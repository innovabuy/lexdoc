import { z } from 'zod';

// Common validation patterns
const emailSchema = z.string().email('Email invalide');

const passwordSchema = z
  .string()
  .min(8, 'Minimum 8 caractères')
  .regex(/[A-Z]/, 'Au moins une majuscule')
  .regex(/[a-z]/, 'Au moins une minuscule')
  .regex(/[0-9]/, 'Au moins un chiffre')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Au moins un caractère spécial');

const phoneSchema = z
  .string()
  .regex(/^(\+33|0)[1-9](\d{2}){4}$/, 'Numéro de téléphone invalide')
  .optional()
  .or(z.literal(''));

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Mot de passe requis'),
});

export const registerSchema = z
  .object({
    cabinetName: z.string().min(2, 'Minimum 2 caractères'),
    cabinetEmail: emailSchema,
    siret: z
      .string()
      .regex(/^\d{14}$/, 'SIRET invalide (14 chiffres)')
      .optional()
      .or(z.literal('')),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    firstName: z.string().min(2, 'Minimum 2 caractères'),
    lastName: z.string().min(2, 'Minimum 2 caractères'),
    phone: phoneSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export const twoFactorSchema = z.object({
  code: z
    .string()
    .length(6, 'Le code doit contenir 6 chiffres')
    .regex(/^\d{6}$/, 'Code invalide'),
});

// User schemas
export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(2, 'Minimum 2 caractères'),
  lastName: z.string().min(2, 'Minimum 2 caractères'),
  role: z.enum(['ADMIN', 'AVOCAT', 'COLLABORATEUR', 'SECRETAIRE']),
  phone: phoneSchema,
});

export const updateUserSchema = z.object({
  firstName: z.string().min(2, 'Minimum 2 caractères').optional(),
  lastName: z.string().min(2, 'Minimum 2 caractères').optional(),
  role: z.enum(['ADMIN', 'AVOCAT', 'COLLABORATEUR', 'SECRETAIRE']).optional(),
  phone: phoneSchema,
  isActive: z.boolean().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

// Profile schema
export const updateProfileSchema = z.object({
  firstName: z.string().min(2, 'Minimum 2 caractères'),
  lastName: z.string().min(2, 'Minimum 2 caractères'),
  phone: phoneSchema,
});

// Cabinet schema
export const updateCabinetSchema = z.object({
  name: z.string().min(2, 'Minimum 2 caractères'),
  address: z.string().optional(),
  postalCode: z
    .string()
    .regex(/^\d{5}$/, 'Code postal invalide')
    .optional()
    .or(z.literal('')),
  city: z.string().optional(),
  phone: phoneSchema,
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type TwoFactorInput = z.infer<typeof twoFactorSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateCabinetInput = z.infer<typeof updateCabinetSchema>;
