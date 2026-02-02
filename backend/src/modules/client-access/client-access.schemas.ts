import { z } from 'zod';

export const inviteClientSchema = z.object({
  email: z.string().email('Email invalide'),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  companyName: z.string().min(1).max(200).optional(),
  folderId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  allowedFolders: z.array(z.string().uuid()).optional(),
  permissions: z.object({
    canSign: z.boolean().default(true),
    canDownload: z.boolean().default(true),
    canComment: z.boolean().default(false),
  }).optional(),
});

export const updatePermissionsSchema = z.object({
  permissions: z.object({
    canSign: z.boolean().optional(),
    canDownload: z.boolean().optional(),
    canComment: z.boolean().optional(),
  }).optional(),
  allowedFolders: z.array(z.string().uuid()).optional(),
});

export const clientAccessIdParamSchema = z.object({
  id: z.string().cuid(),
});

export const clientAccessQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  isActivated: z.enum(['true', 'false']).optional(),
});

export type InviteClientInput = z.infer<typeof inviteClientSchema>;
export type UpdatePermissionsInput = z.infer<typeof updatePermissionsSchema>;
export type ClientAccessQuery = z.infer<typeof clientAccessQuerySchema>;
