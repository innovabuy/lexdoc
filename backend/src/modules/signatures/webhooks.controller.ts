import { Request, Response } from 'express';
import { getUniversignClient } from './universign.client';
import { signaturesService } from './signatures.service';
import { logger } from '@/utils/logger';
import { universignWebhookSchema } from './signatures.schemas';

export class SignatureWebhooksController {
  /**
   * POST /api/webhooks/universign
   * Handle webhook from Universign
   */
  async handleUniversignWebhook(req: Request, res: Response) {
    try {
      // 1. Verify HMAC signature
      const signature = req.headers['x-universign-signature'] as string;
      const payload = JSON.stringify(req.body);

      // In development, we might skip signature verification
      if (process.env.NODE_ENV === 'production') {
        try {
          const universignClient = getUniversignClient();
          const isValid = universignClient.verifyWebhookSignature(payload, signature);

          if (!isValid) {
            logger.error('[Webhook] Invalid Universign signature');
            return res.status(401).json({ error: 'Invalid signature' });
          }
        } catch (error) {
          logger.warn('[Webhook] Could not verify signature, continuing anyway');
        }
      }

      // 2. Validate payload
      const parseResult = universignWebhookSchema.safeParse(req.body);
      if (!parseResult.success) {
        logger.error('[Webhook] Invalid payload:', parseResult.error);
        return res.status(400).json({ error: 'Invalid payload' });
      }

      const webhookData = parseResult.data;
      logger.info(`[Webhook] Received Universign webhook: ${webhookData.transactionId} -> ${webhookData.status}`);

      // 3. Process webhook
      await signaturesService.handleWebhook(webhookData);

      // 4. Respond 200 OK (important for webhook retry logic)
      res.status(200).json({ success: true });
    } catch (error: any) {
      logger.error('[Webhook] Error processing Universign webhook:', error);
      // Return 500 so Universign will retry
      res.status(500).json({ error: 'Internal error' });
    }
  }
}

export const signatureWebhooksController = new SignatureWebhooksController();
