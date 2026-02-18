/**
 * Global setup for live integration tests.
 * Logs in once and stores the token in a temp file.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const TOKEN_FILE = path.join(__dirname, '.live-token');

module.exports = async function globalSetup() {
  const loginData = JSON.stringify({
    email: 'yves-marie.bienaime@pragmavox.fr',
    password: 'Admin2026!',
  });

  const token = await new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 4000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(loginData),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (parsed.data && parsed.data.token) {
              resolve(parsed.data.token);
            } else {
              reject(new Error(`Login failed: ${body}`));
            }
          } catch (e) {
            reject(new Error(`Parse error: ${body}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(loginData);
    req.end();
  });

  fs.writeFileSync(TOKEN_FILE, token);
};
