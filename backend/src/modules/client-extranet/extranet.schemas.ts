import { z } from 'zod';

export const documentIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const folderIdParamSchema = z.object({
  folderId: z.string().uuid(),
});

export const documentsQuerySchema = z.object({
  folderId: z.string().uuid().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type DocumentsQuery = z.infer<typeof documentsQuerySchema>;
