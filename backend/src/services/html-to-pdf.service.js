const puppeteer = require('puppeteer');
const logger = require('../config/logger');

let browser = null;

async function getBrowser() {
  if (browser && browser.connected) {
    return browser;
  }
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  return browser;
}

/**
 * Convert HTML content to a PDF buffer
 * @param {string} htmlContent - Full HTML string
 * @returns {Promise<Buffer>} PDF buffer
 */
async function convertHtmlToPdf(htmlContent) {
  const b = await getBrowser();
  const page = await b.newPage();

  try {
    await page.setContent(htmlContent, { waitUntil: 'networkidle0', timeout: 15000 });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      printBackground: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}

/**
 * Close the singleton browser (for graceful shutdown)
 */
async function closeBrowser() {
  if (browser) {
    try {
      await browser.close();
    } catch (e) {
      logger.warn('Error closing puppeteer browser', { error: e.message });
    }
    browser = null;
  }
}

// Graceful shutdown
process.on('SIGINT', closeBrowser);
process.on('SIGTERM', closeBrowser);

module.exports = {
  convertHtmlToPdf,
  closeBrowser,
};
