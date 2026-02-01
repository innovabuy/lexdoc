import { z } from 'zod';
import { LrarStatus } from '@prisma/client';

// Address schema
export const addressSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis').max(100),
  lastName: z.string().min(1, 'Le nom est requis').max(100),
  address: z.string().min(1, 'L\'adresse est requise').max(255),
  postalCode: z.string().min(1, 'Le code postal est requis').regex(/^[0-9]{5}$/, 'Code postal invalide'),
  city: z.string().min(1, 'La ville est requise').max(100),
  country: z.string().max(2).default('FR'),
});

// Create LRAR shipment
export const createLrarSchema = z.object({
  documentId: z.string().uuid('ID document invalide'),
  subject: z.string().min(1, 'Le sujet est requis').max(255),
  reference: z.string().max(100).optional(),

  // Recipient
  recipient: addressSchema,

  // Sender (optional, will use cabinet info as default)
  sender: addressSchema.optional(),

  // Options
  color: z.boolean().default(false),
  duplexPrinting: z.boolean().default(true),
  registeredMail: z.boolean().default(true),
});

export type CreateLrarInput = z.infer<typeof createLrarSchema>;

// List LRAR query
export const listLrarSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.nativeEnum(LrarStatus).optional(),
  documentId: z.string().uuid().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'status', 'subject']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListLrarInput = z.infer<typeof listLrarSchema>;

// Webhook payload from SendingBox
export const sendingboxWebhookSchema = z.object({
  shipmentId: z.string(),
  status: z.string(),
  reference: z.string().optional(),
  trackingNumber: z.string().optional(),
  trackingEvent: z.object({
    status: z.string(),
    description: z.string().optional(),
    location: z.string().optional(),
    timestamp: z.string(),
  }).optional(),
});

export type SendingboxWebhookPayload = z.infer<typeof sendingboxWebhookSchema>;

// Response types
export interface LrarTrackingEventResponse {
  id: string;
  status: string;
  description?: string;
  location?: string;
  eventAt: Date;
}

export interface LrarShipmentResponse {
  id: string;
  documentId: string;
  subject: string;
  reference?: string;
  status: LrarStatus;
  sendingboxId?: string;
  trackingNumber?: string;

  // Recipient
  recipient: {
    firstName: string;
    lastName: string;
    address: string;
    postalCode: string;
    city: string;
    country: string;
  };

  // Sender
  sender: {
    firstName: string;
    lastName: string;
    address: string;
    postalCode: string;
    city: string;
    country: string;
  };

  // Options
  color: boolean;
  duplexPrinting: boolean;
  registeredMail: boolean;

  // Proof
  proofPath?: string;
  cost?: number;

  // Timestamps
  sentAt?: Date;
  deliveredAt?: Date;
  returnedAt?: Date;
  estimatedDeliveryAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  document: {
    id: string;
    title: string;
    mimeType: string;
  };
  initiator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  trackingEvents: LrarTrackingEventResponse[];
}

export interface LrarListResponse {
  data: LrarShipmentResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
