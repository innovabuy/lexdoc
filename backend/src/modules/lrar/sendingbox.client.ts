import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import crypto from 'crypto';
import FormData from 'form-data';
import { config } from '@/config';
import { logger } from '@/utils/logger';

export interface Recipient {
  firstName: string;
  lastName: string;
  address: string;
  postalCode: string;
  city: string;
  country?: string;
}

export interface LrarParams {
  documentId: string;
  recipient: Recipient;
  sender: Recipient;
  subject: string;
  reference?: string;
  color: boolean;
  duplexPrinting: boolean;
  registeredMail: boolean;
  webhookUrl: string;
}

export interface LrarShipmentResponse {
  id: string;
  status: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  cost?: number;
}

export interface LrarTrackingEvent {
  date: Date;
  status: string;
  description?: string;
  location?: string;
}

export interface LrarStatusResponse {
  status: string;
  trackingNumber?: string;
  trackingEvents: LrarTrackingEvent[];
}

export class SendingBoxClient {
  private client: AxiosInstance;
  private webhookSecret: string;

  constructor(apiKey: string, baseURL: string, webhookSecret: string) {
    this.webhookSecret = webhookSecret;

    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60s for file uploads
    });

    // Request interceptor for logging
    this.client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      logger.info(`[SendingBox] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        logger.error('[SendingBox] Error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        throw error;
      }
    );
  }

  /**
   * Create LRAR shipment
   */
  async createShipment(
    documentBuffer: Buffer,
    documentName: string,
    params: LrarParams
  ): Promise<LrarShipmentResponse> {
    try {
      // 1. Upload document PDF
      const formData = new FormData();
      formData.append('file', documentBuffer, {
        filename: documentName,
        contentType: 'application/pdf',
      });

      const uploadResponse = await this.client.post('/files', formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      const fileId = uploadResponse.data.id;
      logger.info(`[SendingBox] File uploaded: ${fileId}`);

      // 2. Create LRAR shipment
      const response = await this.client.post('/letters', {
        fileId,

        // Recipient
        recipient: {
          firstname: params.recipient.firstName,
          lastname: params.recipient.lastName,
          address_line_1: params.recipient.address,
          postal_code: params.recipient.postalCode,
          city: params.recipient.city,
          country: params.recipient.country || 'FR',
        },

        // Sender
        sender: {
          firstname: params.sender.firstName,
          lastname: params.sender.lastName,
          address_line_1: params.sender.address,
          postal_code: params.sender.postalCode,
          city: params.sender.city,
          country: params.sender.country || 'FR',
        },

        // Options
        color: params.color,
        duplex: params.duplexPrinting,
        registered: params.registeredMail,

        // Metadata
        reference: params.documentId,
        description: params.subject,

        // Webhook
        webhook_url: params.webhookUrl,
      });

      const shipment = response.data;
      logger.info(`[SendingBox] Shipment created: ${shipment.id}`);

      return {
        id: shipment.id,
        status: this.mapStatus(shipment.status),
        trackingNumber: shipment.tracking_number,
        estimatedDelivery: shipment.estimated_delivery
          ? new Date(shipment.estimated_delivery)
          : undefined,
        cost: shipment.cost,
      };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Erreur création envoi LRAR: ${message}`);
    }
  }

  /**
   * Get shipment status
   */
  async getShipmentStatus(shipmentId: string): Promise<LrarStatusResponse> {
    try {
      const response = await this.client.get(`/letters/${shipmentId}`);
      const shipment = response.data;

      return {
        status: this.mapStatus(shipment.status),
        trackingNumber: shipment.tracking_number,
        trackingEvents: shipment.tracking_events?.map((e: any) => ({
          date: new Date(e.timestamp),
          status: e.status,
          description: e.description,
          location: e.location,
        })) || [],
      };
    } catch (error: any) {
      throw new Error(`Erreur récupération statut: ${error.message}`);
    }
  }

  /**
   * Download delivery proof (AR)
   */
  async downloadProof(shipmentId: string): Promise<Buffer> {
    try {
      const response = await this.client.get(
        `/letters/${shipmentId}/proof`,
        { responseType: 'arraybuffer' }
      );

      return Buffer.from(response.data);
    } catch (error: any) {
      throw new Error(`Erreur téléchargement preuve: ${error.message}`);
    }
  }

  /**
   * Cancel shipment (if not yet printed)
   */
  async cancelShipment(shipmentId: string): Promise<void> {
    try {
      await this.client.post(`/letters/${shipmentId}/cancel`);
      logger.info(`[SendingBox] Shipment cancelled: ${shipmentId}`);
    } catch (error: any) {
      throw new Error(`Erreur annulation envoi: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature (HMAC)
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!signature || !this.webhookSecret) {
      return false;
    }

    const hmac = crypto.createHmac('sha256', this.webhookSecret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }

  private mapStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'draft': 'PENDING',
      'pending': 'PENDING',
      'processing': 'PROCESSING',
      'printed': 'PROCESSING',
      'sent': 'SENT',
      'in_transit': 'IN_TRANSIT',
      'out_for_delivery': 'IN_TRANSIT',
      'delivered': 'DELIVERED',
      'returned': 'RETURNED',
      'failed': 'ERROR',
      'cancelled': 'CANCELLED',
    };

    return statusMap[status.toLowerCase()] || status.toUpperCase();
  }
}

// Singleton instance - lazy initialization
let sendingBoxClientInstance: SendingBoxClient | null = null;

export function getSendingBoxClient(): SendingBoxClient {
  if (!sendingBoxClientInstance) {
    if (!config.sendingbox?.apiKey) {
      throw new Error('SENDINGBOX_API_KEY is not configured');
    }

    sendingBoxClientInstance = new SendingBoxClient(
      config.sendingbox.apiKey,
      config.sendingbox.apiUrl,
      config.sendingbox.webhookSecret
    );
  }

  return sendingBoxClientInstance;
}

export default getSendingBoxClient;
