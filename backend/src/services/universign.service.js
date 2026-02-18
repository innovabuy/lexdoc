const axios = require('axios');
const logger = require('../config/logger');

class UniversignService {
  constructor() {
    this.apiUrl = process.env.UNIVERSIGN_URL || process.env.UNIVERSIGN_API_URL;
    this.apiKey = process.env.UNIVERSIGN_API_KEY;
    this.callbackUrl = process.env.UNIVERSIGN_CALLBACK_URL || `${process.env.API_URL}/api/webhooks/universign`;
  }

  async createTransaction(documentUrl, signers) {
    try {
      logger.info('Creating Universign transaction', {
        documentUrl: documentUrl?.substring(0, 50) + '...',
        signersCount: signers.length,
      });

      const { data } = await axios.post(
        `${this.apiUrl}/transactions`,
        {
          documents: [{ url: documentUrl }],
          signers: signers.map(s => ({
            email: s.email,
            firstName: s.firstName,
            lastName: s.lastName,
          })),
          profile: 'default',
          callbackUrl: this.callbackUrl,
        },
        {
          headers: { Authorization: `Bearer ${this.apiKey}` },
          timeout: 30000,
        }
      );

      logger.info('Universign transaction created', {
        transactionId: data.id,
        signersCount: data.signers?.length,
      });

      return {
        transactionId: data.id,
        signatureUrls: data.signers?.map(s => ({ email: s.email, url: s.url })) || [],
      };
    } catch (error) {
      logger.error('Universign transaction creation failed', {
        error: error.message,
        response: error.response?.data,
      });
      throw new Error(`Universign transaction creation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getTransactionStatus(transactionId) {
    try {
      logger.info('Getting Universign transaction status', { transactionId });

      const { data } = await axios.get(
        `${this.apiUrl}/transactions/${transactionId}`,
        {
          headers: { Authorization: `Bearer ${this.apiKey}` },
          timeout: 15000,
        }
      );

      logger.info('Universign transaction status retrieved', {
        transactionId,
        status: data.status,
      });

      return {
        status: data.status,
        signedDocumentUrl: data.signedDocumentUrl,
        certificate: data.certificate,
        certificateUrl: data.certificateUrl,
        signers: data.signers,
      };
    } catch (error) {
      logger.error('Failed to get Universign transaction status', {
        transactionId,
        error: error.message,
      });
      throw new Error(`Failed to get transaction status: ${error.message}`);
    }
  }

  /**
   * Cancel a pending transaction
   */
  async cancelTransaction(transactionId) {
    try {
      logger.info('Cancelling Universign transaction', { transactionId });

      await axios.delete(
        `${this.apiUrl}/transactions/${transactionId}`,
        {
          headers: { Authorization: `Bearer ${this.apiKey}` },
          timeout: 15000,
        }
      );

      logger.info('Universign transaction cancelled', { transactionId });
      return true;
    } catch (error) {
      logger.error('Failed to cancel Universign transaction', {
        transactionId,
        error: error.message,
      });
      throw new Error(`Failed to cancel transaction: ${error.message}`);
    }
  }
}

module.exports = new UniversignService();
