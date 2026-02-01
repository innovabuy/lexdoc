import { z } from 'zod';

export const updateCabinetSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  email: z.string().email('Invalid email address').optional(),
  address: z.string().max(500).optional().nullable(),
  postalCode: z.string().max(10).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  siret: z
    .string()
    .regex(/^[0-9]{14}$/, 'SIRET must be 14 digits')
    .optional()
    .nullable(),
});

export type UpdateCabinetInput = z.infer<typeof updateCabinetSchema>;
