import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import crypto from 'crypto';
import { config } from '@/config';
import { logger } from '@/utils/logger';

export interface Signatory {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface SignatureTransactionParams {
  documentId: string;
  signatories: Signatory[];
  title: string;
  description?: string;
  profile: 'default' | 'certified' | 'advanced';
  language: 'fr' | 'en';
  successUrl?: string;
  cancelUrl?: string;
  webhookUrl: string;
}

export interface UniversignTransaction {
  id: string;
  status: string;
  signers: Array<{
    email: string;
    url: string;
    status: string;
  }>;
  expiresAt: Date;
}

export interface UniversignTransactionStatus {
  status: string;
  signers: Array<{
    email: string;
    status: string;
    signedAt?: Date;
  }>;
}

export class UniversignClient {
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
      timeout: 30000,
    });

    // Request interceptor for logging
    this.client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      logger.info(`[Universign] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        logger.error('[Universign] Error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        throw error;
      }
    );
  }

  /**
   * Create a signature transaction
   */
  async createTransaction(
    documentBuffer: Buffer,
    documentName: string,
    params: SignatureTransactionParams
  ): Promise<UniversignTransaction> {
    try {
      // 1. Upload document
      const uploadResponse = await this.client.post('/documents', documentBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(documentName)}"`,
        },
      });

      const universignDocumentId = uploadResponse.data.id;
      logger.info(`[Universign] Document uploaded: ${universignDocumentId}`);

      // 2. Create signature transaction
      const response = await this.client.post('/transactions', {
        documents: [{
          id: universignDocumentId,
          name: documentName,
        }],
        signers: params.signatories.map((s, index) => ({
          firstname: s.firstName,
          lastname: s.lastName,
          email: s.email,
          phone: s.phone,
          order: index + 1,
        })),
        profile: params.profile,
        language: params.language,
        handwrittenSignatureMode: 'draw',
        chainingMode: 'email',
        finalDocSentByEmail: true,

        // Callbacks
        successURL: params.successUrl,
        cancelURL: params.cancelUrl,
        callbackURL: params.webhookUrl,

        // Metadata
        customId: params.documentId,
        description: params.description,
      });

      const transaction = response.data;
      logger.info(`[Universign] Transaction created: ${transaction.id}`);

      return {
        id: transaction.id,
        status: this.mapStatus(transaction.status),
        signers: transaction.signers.map((s: any) => ({
          email: s.email,
          url: s.url,
          status: this.mapSignerStatus(s.status),
        })),
        expiresAt: new Date(transaction.expiresAt),
      };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Erreur création transaction Universign: ${message}`);
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionId: string): Promise<UniversignTransactionStatus> {
    try {
      const response = await this.client.get(`/transactions/${transactionId}`);
      const transaction = response.data;

      return {
        status: this.mapStatus(transaction.status),
        signers: transaction.signers.map((s: any) => ({
          email: s.email,
          status: this.mapSignerStatus(s.status),
          signedAt: s.signedAt ? new Date(s.signedAt) : undefined,
        })),
      };
    } catch (error: any) {
      throw new Error(`Erreur récupération statut: ${error.message}`);
    }
  }

  /**
   * Download signed document
   */
  async downloadSignedDocument(transactionId: string): Promise<Buffer> {
    try {
      const response = await this.client.get(
        `/transactions/${transactionId}/documents/signed`,
        { responseType: 'arraybuffer' }
      );

      return Buffer.from(response.data);
    } catch (error: any) {
      throw new Error(`Erreur téléchargement document signé: ${error.message}`);
    }
  }

  /**
   * Download certificates
   */
  async downloadCertificates(transactionId: string): Promise<Buffer> {
    try {
      const response = await this.client.get(
        `/transactions/${transactionId}/certificates`,
        { responseType: 'arraybuffer' }
      );

      return Buffer.from(response.data);
    } catch (error: any) {
      throw new Error(`Erreur téléchargement certificats: ${error.message}`);
    }
  }

  /**
   * Cancel transaction
   */
  async cancelTransaction(transactionId: string): Promise<void> {
    try {
      await this.client.post(`/transactions/${transactionId}/cancel`);
      logger.info(`[Universign] Transaction cancelled: ${transactionId}`);
    } catch (error: any) {
      throw new Error(`Erreur annulation transaction: ${error.message}`);
    }
  }

  /**
   * Send reminder to signatory
   */
  async remindSigner(transactionId: string, signerEmail: string): Promise<void> {
    try {
      await this.client.post(`/transactions/${transactionId}/remind`, {
        email: signerEmail,
      });
      logger.info(`[Universign] Reminder sent to ${signerEmail}`);
    } catch (error: any) {
      throw new Error(`Erreur relance signataire: ${error.message}`);
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
      'ready': 'PENDING',
      'pending': 'PENDING',
      'in_progress': 'IN_PROGRESS',
      'completed': 'COMPLETED',
      'canceled': 'CANCELLED',
      'cancelled': 'CANCELLED',
      'expired': 'EXPIRED',
      'failed': 'ERROR',
    };

    return statusMap[status.toLowerCase()] || status.toUpperCase();
  }

  private mapSignerStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'waiting': 'PENDING',
      'pending': 'PENDING',
      'in_progress': 'IN_PROGRESS',
      'signed': 'SIGNED',
      'refused': 'REFUSED',
    };

    return statusMap[status.toLowerCase()] || status.toUpperCase();
  }
}

// Singleton instance - lazy initialization
let universignClientInstance: UniversignClient | null = null;

export function getUniversignClient(): UniversignClient {
  if (!universignClientInstance) {
    if (!config.universign?.apiKey) {
      throw new Error('UNIVERSIGN_API_KEY is not configured');
    }

    universignClientInstance = new UniversignClient(
      config.universign.apiKey,
      config.universign.apiUrl,
      config.universign.webhookSecret
    );
  }

  return universignClientInstance;
}

export default getUniversignClient;
