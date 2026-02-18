const axios = require('axios');
const crypto = require('crypto');
const logger = require('../config/logger');

class SendingBoxService {
  constructor() {
    this.apiUrl = process.env.SENDINGBOX_API_URL;
    this.apiKey = process.env.SENDINGBOX_API_KEY;
    this.callbackUrl = process.env.SENDINGBOX_CALLBACK_URL || `${process.env.API_URL}/api/webhooks/sendingbox`;
    this.demoMode = process.env.SENDINGBOX_DEMO_MODE === 'true';
  }

  /**
   * Send a registered mail (LRAR) via SendingBox
   */
  async sendRegisteredMail(document, recipient) {
    // Demo mode: simulate sending without calling SendingBox API
    if (this.demoMode) {
      const fakeId = `demo-${crypto.randomUUID()}`;
      const fakeTracking = `DEMO${Date.now()}`;
      logger.info('SendingBox DEMO MODE: LRAR simulated', {
        sendingBoxId: fakeId,
        trackingNumber: fakeTracking,
        recipientName: recipient.name,
      });
      return {
        sendingBoxId: fakeId,
        trackingNumber: fakeTracking,
        cost: 5.80,
        status: 'sent',
      };
    }

    try {
      logger.info('Sending LRAR via SendingBox', {
        recipientName: recipient.name,
        recipientCity: recipient.city,
      });

      const { data } = await axios.post(
        `${this.apiUrl}/v1/registered-mails`,
        {
          documentUrl: document.url,
          recipient: {
            name: recipient.name,
            address: recipient.address,
            postalCode: recipient.postalCode,
            city: recipient.city,
            country: recipient.country || 'FR',
          },
          options: {
            color: false,
            duplexPrinting: false,
            acknowledgmentOfReceipt: true, // AR (Accusé de Réception)
          },
          callbackUrl: this.callbackUrl,
        },
        {
          headers: { 'X-API-Key': this.apiKey },
          timeout: 30000,
        }
      );

      logger.info('LRAR sent via SendingBox', {
        sendingBoxId: data.id,
        trackingNumber: data.trackingNumber,
        estimatedCost: data.estimatedCost,
      });

      return {
        sendingBoxId: data.id,
        trackingNumber: data.trackingNumber,
        cost: data.estimatedCost,
        status: data.status,
      };
    } catch (error) {
      logger.error('SendingBox LRAR failed', {
        error: error.message,
        response: error.response?.data,
      });
      throw new Error(`SendingBox LRAR failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get tracking status for a registered mail
   */
  async getTrackingStatus(trackingNumber) {
    try {
      logger.info('Getting SendingBox tracking status', { trackingNumber });

      const { data } = await axios.get(
        `${this.apiUrl}/v1/tracking/${trackingNumber}`,
        {
          headers: { 'X-API-Key': this.apiKey },
          timeout: 15000,
        }
      );

      logger.info('SendingBox tracking status retrieved', {
        trackingNumber,
        status: data.status,
      });

      return {
        status: data.status,
        deliveredAt: data.deliveredAt,
        returnedAt: data.returnedAt,
        proofUrl: data.proofUrl,
        events: data.events || [],
      };
    } catch (error) {
      logger.error('Failed to get SendingBox tracking status', {
        trackingNumber,
        error: error.message,
      });
      throw new Error(`Failed to get tracking status: ${error.message}`);
    }
  }

  /**
   * Get shipment details by ID
   */
  async getShipmentById(sendingBoxId) {
    try {
      logger.info('Getting SendingBox shipment', { sendingBoxId });

      const { data } = await axios.get(
        `${this.apiUrl}/v1/registered-mails/${sendingBoxId}`,
        {
          headers: { 'X-API-Key': this.apiKey },
          timeout: 15000,
        }
      );

      return {
        id: data.id,
        status: data.status,
        trackingNumber: data.trackingNumber,
        deliveredAt: data.deliveredAt,
        proofUrl: data.proofUrl,
        cost: data.cost,
      };
    } catch (error) {
      logger.error('Failed to get SendingBox shipment', {
        sendingBoxId,
        error: error.message,
      });
      throw new Error(`Failed to get shipment: ${error.message}`);
    }
  }

  /**
   * Cancel a shipment (only if not yet printed/sent)
   */
  async cancelShipment(sendingBoxId) {
    try {
      logger.info('Cancelling SendingBox shipment', { sendingBoxId });

      await axios.delete(
        `${this.apiUrl}/v1/registered-mails/${sendingBoxId}`,
        {
          headers: { 'X-API-Key': this.apiKey },
          timeout: 15000,
        }
      );

      logger.info('SendingBox shipment cancelled', { sendingBoxId });
      return true;
    } catch (error) {
      logger.error('Failed to cancel SendingBox shipment', {
        sendingBoxId,
        error: error.message,
      });
      throw new Error(`Failed to cancel shipment: ${error.message}`);
    }
  }

  /**
   * Download delivery proof
   */
  async getDeliveryProof(sendingBoxId) {
    try {
      const { data } = await axios.get(
        `${this.apiUrl}/v1/registered-mails/${sendingBoxId}/proof`,
        {
          headers: { 'X-API-Key': this.apiKey },
          timeout: 15000,
          responseType: 'arraybuffer',
        }
      );

      return {
        buffer: data,
        contentType: 'application/pdf',
      };
    } catch (error) {
      logger.error('Failed to get delivery proof', {
        sendingBoxId,
        error: error.message,
      });
      throw new Error(`Failed to get delivery proof: ${error.message}`);
    }
  }
}

module.exports = new SendingBoxService();
