import { Request, Response } from 'express';
import { getSendingBoxClient } from './sendingbox.client';
import { lrarService, generatedDocumentLrarService } from './lrar.service';
import { logger } from '@/utils/logger';
import { sendingboxWebhookSchema } from './lrar.schemas';

export class LrarWebhooksController {
  /**
   * POST /api/webhooks/sendingbox
   * Handle webhook from SendingBox
   */
  async handleSendingboxWebhook(req: Request, res: Response) {
    try {
      // 1. Verify HMAC signature
      const signature = req.headers['x-sendingbox-signature'] as string;
      const payload = JSON.stringify(req.body);

      // In production, verify signature
      if (process.env.NODE_ENV === 'production') {
        try {
          const sendingBoxClient = getSendingBoxClient();
          const isValid = sendingBoxClient.verifyWebhookSignature(payload, signature);

          if (!isValid) {
            logger.error('[Webhook] Invalid SendingBox signature');
            return res.status(401).json({ error: 'Invalid signature' });
          }
        } catch (error) {
          logger.warn('[Webhook] Could not verify signature, continuing anyway');
        }
      }

      // 2. Validate payload
      const parseResult = sendingboxWebhookSchema.safeParse(req.body);
      if (!parseResult.success) {
        logger.error('[Webhook] Invalid payload:', parseResult.error);
        return res.status(400).json({ error: 'Invalid payload' });
      }

      const webhookData = parseResult.data;
      logger.info(`[Webhook] Received SendingBox webhook: ${webhookData.shipmentId} -> ${webhookData.status}`);

      // 3. Process webhook for both regular and generated documents
      await lrarService.handleWebhook(webhookData);
      await generatedDocumentLrarService.handleGeneratedDocumentWebhook(webhookData);

      // 4. Respond 200 OK (important for webhook retry logic)
      res.status(200).json({ success: true });
    } catch (error: any) {
      logger.error('[Webhook] Error processing SendingBox webhook:', error);
      // Return 500 so SendingBox will retry
      res.status(500).json({ error: 'Internal error' });
    }
  }
}

export const lrarWebhooksController = new LrarWebhooksController();
