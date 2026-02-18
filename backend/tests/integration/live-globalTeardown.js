const fs = require('fs');
const path = require('path');

const TOKEN_FILE = path.join(__dirname, '.live-token');

module.exports = async function globalTeardown() {
  try {
    fs.unlinkSync(TOKEN_FILE);
  } catch (_) {
    // Ignore
  }
};
