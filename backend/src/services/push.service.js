const webpush = require('web-push');
const prisma = require('../config/database');
const logger = require('../config/logger');

class PushService {
  constructor() {
    // Configure VAPID keys if available
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:contact@lexdoc.fr',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
      this.enabled = true;
    } else {
      logger.warn('Push notifications disabled: VAPID keys not configured');
      this.enabled = false;
    }
  }

  async subscribe(accessId, subscription) {
    if (!this.enabled) {
      throw new Error('Push notifications are not configured');
    }

    // Store subscription
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        keys: subscription.keys,
        accessId,
      },
      create: {
        accessId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
    });

    return { success: true };
  }

  async unsubscribe(endpoint) {
    await prisma.pushSubscription.delete({
      where: { endpoint },
    }).catch(() => {
      // Ignore if not found
    });

    return { success: true };
  }

  async sendNotification(accessId, payload) {
    if (!this.enabled) {
      logger.warn('Push notification skipped: not configured');
      return { sent: 0, failed: 0 };
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { accessId },
    });

    let sent = 0;
    let failed = 0;

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: subscription.keys,
          },
          JSON.stringify(payload)
        );
        sent++;
      } catch (error) {
        failed++;
        logger.error('Push notification failed', { error: error.message, endpoint: subscription.endpoint });

        // Remove invalid subscriptions
        if (error.statusCode === 404 || error.statusCode === 410) {
          await prisma.pushSubscription.delete({
            where: { id: subscription.id },
          }).catch(() => {});
        }
      }
    }

    return { sent, failed };
  }

  async notifyNewDocument(accessId, document) {
    return this.sendNotification(accessId, {
      title: 'Nouveau document',
      body: `Un nouveau document est disponible : ${document.name}`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        type: 'NEW_DOCUMENT',
        documentId: document.id,
        url: `/documents/${document.id}`,
      },
      actions: [
        { action: 'view', title: 'Voir le document' },
        { action: 'close', title: 'Fermer' },
      ],
    });
  }

  async notifySignatureRequired(accessId, document) {
    return this.sendNotification(accessId, {
      title: 'Signature requise',
      body: `Le document "${document.name}" nécessite votre signature`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: `signature-${document.id}`,
      requireInteraction: true,
      data: {
        type: 'SIGNATURE_REQUIRED',
        documentId: document.id,
        url: `/documents/${document.id}`,
      },
      actions: [
        { action: 'sign', title: 'Signer maintenant' },
        { action: 'later', title: 'Plus tard' },
      ],
    });
  }

  async notifySignatureComplete(accessId, document) {
    return this.sendNotification(accessId, {
      title: 'Document signé',
      body: `Le document "${document.name}" a été signé avec succès`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        type: 'SIGNATURE_COMPLETE',
        documentId: document.id,
        url: `/documents/${document.id}`,
      },
    });
  }

  async notifyLRARDelivered(accessId, document, trackingNumber) {
    return this.sendNotification(accessId, {
      title: 'Courrier livré',
      body: `Le courrier recommandé "${document.name}" a été livré`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        type: 'LRAR_DELIVERED',
        documentId: document.id,
        trackingNumber,
        url: `/documents/${document.id}`,
      },
    });
  }

  getVapidPublicKey() {
    return process.env.VAPID_PUBLIC_KEY || null;
  }
}

module.exports = new PushService();
