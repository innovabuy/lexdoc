import webpush, { PushSubscription as WebPushSubscription, SendResult } from 'web-push';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  data?: Record<string, any>;
}

class PushNotificationService {
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
      logger.warn('VAPID keys not configured. Push notifications will be disabled.');
      return;
    }

    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    this.isConfigured = true;
    logger.info('Push notification service initialized');
  }

  async subscribe(
    clientAccessId: string,
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
  ): Promise<boolean> {
    try {
      await prisma.pushSubscription.upsert({
        where: { endpoint: subscription.endpoint },
        update: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          updatedAt: new Date(),
        },
        create: {
          clientAccessId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      });

      logger.info(`Push subscription saved for client: ${clientAccessId}`);
      return true;
    } catch (error) {
      logger.error('Failed to save push subscription:', error);
      return false;
    }
  }

  async unsubscribe(endpoint: string): Promise<boolean> {
    try {
      await prisma.pushSubscription.delete({
        where: { endpoint },
      });
      logger.info(`Push subscription removed: ${endpoint}`);
      return true;
    } catch (error) {
      logger.error('Failed to remove push subscription:', error);
      return false;
    }
  }

  async sendToClient(clientAccessId: string, payload: PushPayload): Promise<number> {
    if (!this.isConfigured) {
      logger.warn('Push notifications not configured');
      return 0;
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { clientAccessId },
    });

    if (subscriptions.length === 0) {
      logger.info(`No push subscriptions found for client: ${clientAccessId}`);
      return 0;
    }

    let successCount = 0;
    const notification = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/icon-72x72.png',
      tag: payload.tag,
      data: {
        url: payload.url || '/extranet/dashboard',
        ...payload.data,
      },
    });

    for (const sub of subscriptions) {
      try {
        const pushSubscription: WebPushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        await webpush.sendNotification(pushSubscription, notification);
        successCount++;
      } catch (error: any) {
        // Remove invalid subscriptions (410 Gone or 404 Not Found)
        if (error.statusCode === 410 || error.statusCode === 404) {
          await this.unsubscribe(sub.endpoint);
          logger.info(`Removed stale subscription: ${sub.endpoint}`);
        } else {
          logger.error(`Failed to send push notification to ${sub.endpoint}:`, error);
        }
      }
    }

    logger.info(`Sent ${successCount}/${subscriptions.length} push notifications to client: ${clientAccessId}`);
    return successCount;
  }

  async sendToMultipleClients(clientAccessIds: string[], payload: PushPayload): Promise<number> {
    let totalSuccess = 0;

    for (const clientId of clientAccessIds) {
      totalSuccess += await this.sendToClient(clientId, payload);
    }

    return totalSuccess;
  }

  async notifyNewDocument(
    clientAccessId: string,
    documentTitle: string,
    documentId: string
  ): Promise<number> {
    return this.sendToClient(clientAccessId, {
      title: 'Nouveau document',
      body: `Un nouveau document "${documentTitle}" est disponible`,
      tag: `document-${documentId}`,
      url: `/extranet/documents/${documentId}`,
    });
  }

  async notifySignatureRequired(
    clientAccessId: string,
    documentTitle: string,
    documentId: string
  ): Promise<number> {
    return this.sendToClient(clientAccessId, {
      title: 'Signature requise',
      body: `Le document "${documentTitle}" requiert votre signature`,
      tag: `signature-${documentId}`,
      url: `/extranet/documents/${documentId}`,
    });
  }

  async notifySignatureReminder(
    clientAccessId: string,
    documentTitle: string,
    documentId: string,
    reminderNumber: number
  ): Promise<number> {
    return this.sendToClient(clientAccessId, {
      title: `Rappel #${reminderNumber}: Signature en attente`,
      body: `Le document "${documentTitle}" attend toujours votre signature`,
      tag: `reminder-${documentId}`,
      url: `/extranet/documents/${documentId}`,
    });
  }

  getPublicKey(): string | null {
    return process.env.VAPID_PUBLIC_KEY || null;
  }

  isEnabled(): boolean {
    return this.isConfigured;
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
