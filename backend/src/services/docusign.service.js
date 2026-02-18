const axios = require('axios');
const logger = require('../config/logger');

const crypto = require('crypto');

const DOCUSIGN_CONFIG = {
  authServer: process.env.DOCUSIGN_AUTH_SERVER || 'https://account-d.docusign.com',
  apiBaseUrl: process.env.DOCUSIGN_API_BASE || 'https://demo.docusign.net/restapi',
  integrationKey: process.env.DOCUSIGN_INTEGRATION_KEY || '',
  secretKey: process.env.DOCUSIGN_SECRET_KEY || '',
  accountId: process.env.DOCUSIGN_ACCOUNT_ID || '',
  redirectUri: process.env.DOCUSIGN_REDIRECT_URI || '',
  webhookUrl: process.env.DOCUSIGN_WEBHOOK_URL || `${process.env.API_URL || process.env.FRONTEND_URL || ''}/api/webhooks/docusign`,
  demoMode: process.env.DOCUSIGN_DEMO_MODE === 'true',
};

class DocuSignService {
  /**
   * Get OAuth2 authorization URL
   */
  getAuthorizationUrl(state = '') {
    const params = new URLSearchParams({
      response_type: 'code',
      scope: 'signature impersonation',
      client_id: DOCUSIGN_CONFIG.integrationKey,
      redirect_uri: DOCUSIGN_CONFIG.redirectUri,
      state,
    });
    return `${DOCUSIGN_CONFIG.authServer}/oauth/auth?${params}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForToken(code) {
    try {
      const credentials = Buffer.from(
        `${DOCUSIGN_CONFIG.integrationKey}:${DOCUSIGN_CONFIG.secretKey}`
      ).toString('base64');

      const { data } = await axios.post(
        `${DOCUSIGN_CONFIG.authServer}/oauth/token`,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
        }).toString(),
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 15000,
        }
      );

      logger.info('DocuSign token exchange successful');

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      };
    } catch (error) {
      logger.error('DocuSign token exchange failed', {
        error: error.message,
        response: error.response?.data,
      });
      throw new Error(`DocuSign token exchange failed: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken) {
    try {
      const credentials = Buffer.from(
        `${DOCUSIGN_CONFIG.integrationKey}:${DOCUSIGN_CONFIG.secretKey}`
      ).toString('base64');

      const { data } = await axios.post(
        `${DOCUSIGN_CONFIG.authServer}/oauth/token`,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }).toString(),
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 15000,
        }
      );

      logger.info('DocuSign token refresh successful');

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      };
    } catch (error) {
      logger.error('DocuSign token refresh failed', { error: error.message });
      throw new Error(`DocuSign token refresh failed: ${error.message}`);
    }
  }

  /**
   * Get user info (to verify connection)
   */
  async getUserInfo(accessToken) {
    try {
      const { data } = await axios.get(
        `${DOCUSIGN_CONFIG.authServer}/oauth/userinfo`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` },
          timeout: 10000,
        }
      );
      return {
        name: data.name,
        email: data.email,
        accountId: data.accounts?.[0]?.account_id,
        accountName: data.accounts?.[0]?.account_name,
      };
    } catch (error) {
      logger.error('DocuSign getUserInfo failed', { error: error.message });
      throw new Error(`Failed to get DocuSign user info: ${error.message}`);
    }
  }

  /**
   * Send an envelope for signature
   */
  async sendEnvelope(accessToken, params) {
    const {
      documentBuffer,
      documentName,
      signers,
      subject,
      message,
      expiresAfterDays,
    } = params;

    // Demo mode: simulate envelope creation without calling DocuSign
    if (DOCUSIGN_CONFIG.demoMode) {
      const fakeEnvelopeId = `demo-${crypto.randomUUID()}`;
      logger.info('DocuSign DEMO MODE: envelope simulated', { envelopeId: fakeEnvelopeId, signers: signers.map(s => s.email) });
      return { envelopeId: fakeEnvelopeId };
    }

    const documentBase64 = documentBuffer.toString('base64');

    const envelope = {
      emailSubject: subject,
      emailBlurb: message || 'Veuillez signer ce document.',
      documents: [{
        documentBase64,
        name: documentName,
        fileExtension: documentName.endsWith('.pdf') ? 'pdf' : 'docx',
        documentId: '1',
      }],
      recipients: {
        signers: signers.map((s, i) => ({
          email: s.email,
          name: s.name,
          recipientId: String(i + 1),
          routingOrder: String(s.routingOrder || i + 1),
          tabs: {
            signHereTabs: [{
              documentId: '1',
              pageNumber: '1',
              xPosition: '100',
              yPosition: '700',
            }],
            dateSignedTabs: [{
              documentId: '1',
              pageNumber: '1',
              xPosition: '300',
              yPosition: '700',
            }],
          },
        })),
      },
      status: 'sent',
      eventNotification: {
        url: DOCUSIGN_CONFIG.webhookUrl,
        loggingEnabled: 'true',
        requireAcknowledgment: 'true',
        envelopeEvents: [
          { envelopeEventStatusCode: 'completed' },
          { envelopeEventStatusCode: 'declined' },
          { envelopeEventStatusCode: 'voided' },
        ],
        recipientEvents: [
          { recipientEventStatusCode: 'Completed' },
          { recipientEventStatusCode: 'Declined' },
          { recipientEventStatusCode: 'AuthenticationFailed' },
        ],
      },
    };

    if (expiresAfterDays) {
      envelope.expirations = {
        expireEnabled: 'true',
        expireAfter: String(expiresAfterDays),
        expireWarn: String(Math.max(1, expiresAfterDays - 2)),
      };
    }

    try {
      const accountId = DOCUSIGN_CONFIG.accountId;
      const { data } = await axios.post(
        `${DOCUSIGN_CONFIG.apiBaseUrl}/v2.1/accounts/${accountId}/envelopes`,
        envelope,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      logger.info('DocuSign envelope sent', { envelopeId: data.envelopeId });

      return { envelopeId: data.envelopeId };
    } catch (error) {
      logger.error('DocuSign sendEnvelope failed', {
        error: error.message,
        response: error.response?.data,
      });
      throw new Error(`DocuSign send failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get envelope status
   */
  async getEnvelopeStatus(accessToken, envelopeId) {
    try {
      const accountId = DOCUSIGN_CONFIG.accountId;
      const { data } = await axios.get(
        `${DOCUSIGN_CONFIG.apiBaseUrl}/v2.1/accounts/${accountId}/envelopes/${envelopeId}`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` },
          timeout: 15000,
        }
      );
      return {
        status: data.status,
        sentDateTime: data.sentDateTime,
        completedDateTime: data.completedDateTime,
        voidedDateTime: data.voidedDateTime,
        recipients: data.recipients,
      };
    } catch (error) {
      logger.error('DocuSign getEnvelopeStatus failed', { envelopeId, error: error.message });
      throw new Error(`Failed to get envelope status: ${error.message}`);
    }
  }

  /**
   * Download signed document
   */
  async downloadSignedDocument(accessToken, envelopeId) {
    try {
      const accountId = DOCUSIGN_CONFIG.accountId;
      const { data } = await axios.get(
        `${DOCUSIGN_CONFIG.apiBaseUrl}/v2.1/accounts/${accountId}/envelopes/${envelopeId}/documents/combined`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` },
          responseType: 'arraybuffer',
          timeout: 30000,
        }
      );
      return Buffer.from(data);
    } catch (error) {
      logger.error('DocuSign downloadSignedDocument failed', { envelopeId, error: error.message });
      throw new Error(`Failed to download signed document: ${error.message}`);
    }
  }
}

module.exports = new DocuSignService();
module.exports.DOCUSIGN_CONFIG = DOCUSIGN_CONFIG;
