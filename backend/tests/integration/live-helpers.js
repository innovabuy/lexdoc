/**
 * Shared helpers for live integration tests.
 * Reads the auth token from file (written by globalSetup).
 */
const fs = require('fs');
const path = require('path');

const API = 'http://localhost:4000';
const TOKEN_FILE = path.join(__dirname, '.live-token');

function getAuthToken() {
  return fs.readFileSync(TOKEN_FILE, 'utf8').trim();
}

module.exports = { API, getAuthToken };
