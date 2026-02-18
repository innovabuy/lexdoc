const crypto = require('crypto');

// Simulate encryption service functions
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey() {
  const key = process.env.DOCUMENT_ENCRYPTION_KEY || 'test-encryption-key-32-chars-ok';
  return Buffer.from(key.padEnd(KEY_LENGTH, '0').slice(0, KEY_LENGTH));
}

function encryptDocument(buffer) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(buffer),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

function decryptDocument(encryptedBuffer, ivHex, authTagHex) {
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encryptedBuffer),
    decipher.final(),
  ]);

  return decrypted;
}

describe('Crypto Service', () => {
  describe('encryptDocument', () => {
    it('should encrypt buffer correctly', () => {
      const original = Buffer.from('Test document content');
      const { encrypted, iv, authTag } = encryptDocument(original);

      expect(encrypted).toBeInstanceOf(Buffer);
      expect(encrypted).not.toEqual(original);
      expect(iv).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(authTag).toHaveLength(32); // 16 bytes = 32 hex chars
    });

    it('should produce different ciphertext for same plaintext', () => {
      const original = Buffer.from('Same content');
      const result1 = encryptDocument(original);
      const result2 = encryptDocument(original);

      // IVs should be different (random)
      expect(result1.iv).not.toBe(result2.iv);

      // Encrypted data should be different
      expect(result1.encrypted.toString('hex')).not.toBe(result2.encrypted.toString('hex'));
    });

    it('should handle empty buffer', () => {
      const original = Buffer.from('');
      const { encrypted, iv, authTag } = encryptDocument(original);

      expect(encrypted).toBeInstanceOf(Buffer);
      expect(iv).toBeDefined();
      expect(authTag).toBeDefined();
    });

    it('should handle large buffers', () => {
      const original = Buffer.alloc(1024 * 1024, 'A'); // 1MB of 'A's
      const { encrypted, iv, authTag } = encryptDocument(original);

      expect(encrypted).toBeInstanceOf(Buffer);
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('should handle binary content', () => {
      const original = Buffer.from([0x00, 0xFF, 0x12, 0x34, 0x56, 0x78]);
      const { encrypted } = encryptDocument(original);

      expect(encrypted).toBeInstanceOf(Buffer);
    });
  });

  describe('decryptDocument', () => {
    it('should decrypt correctly with valid key', () => {
      const original = Buffer.from('Test document content');
      const { encrypted, iv, authTag } = encryptDocument(original);

      const decrypted = decryptDocument(encrypted, iv, authTag);

      expect(decrypted.toString()).toBe(original.toString());
    });

    it('should round-trip binary content', () => {
      const original = Buffer.from([0x00, 0xFF, 0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC]);
      const { encrypted, iv, authTag } = encryptDocument(original);

      const decrypted = decryptDocument(encrypted, iv, authTag);

      expect(decrypted).toEqual(original);
    });

    it('should round-trip UTF-8 content', () => {
      const original = Buffer.from('Contenu français avec accents: éàüö et emojis: 🎉📄');
      const { encrypted, iv, authTag } = encryptDocument(original);

      const decrypted = decryptDocument(encrypted, iv, authTag);

      expect(decrypted.toString('utf8')).toBe(original.toString('utf8'));
    });

    it('should fail with wrong auth tag', () => {
      const original = Buffer.from('Test content');
      const { encrypted, iv } = encryptDocument(original);

      const wrongAuthTag = crypto.randomBytes(16).toString('hex');

      expect(() => {
        decryptDocument(encrypted, iv, wrongAuthTag);
      }).toThrow();
    });

    it('should fail with wrong IV', () => {
      const original = Buffer.from('Test content');
      const { encrypted, authTag } = encryptDocument(original);

      const wrongIv = crypto.randomBytes(16).toString('hex');

      expect(() => {
        decryptDocument(encrypted, wrongIv, authTag);
      }).toThrow();
    });

    it('should fail with tampered ciphertext', () => {
      const original = Buffer.from('Test content');
      const { encrypted, iv, authTag } = encryptDocument(original);

      // Tamper with encrypted data
      encrypted[0] = encrypted[0] ^ 0xFF;

      expect(() => {
        decryptDocument(encrypted, iv, authTag);
      }).toThrow();
    });
  });

  describe('Key derivation', () => {
    it('should produce consistent key from same input', () => {
      const key1 = getEncryptionKey();
      const key2 = getEncryptionKey();

      expect(key1.toString('hex')).toBe(key2.toString('hex'));
    });

    it('should produce 32-byte key', () => {
      const key = getEncryptionKey();

      expect(key.length).toBe(32);
    });
  });

  describe('Integration', () => {
    it('should encrypt and decrypt multiple documents independently', () => {
      const doc1 = Buffer.from('Document 1 content');
      const doc2 = Buffer.from('Document 2 content');

      const encrypted1 = encryptDocument(doc1);
      const encrypted2 = encryptDocument(doc2);

      const decrypted1 = decryptDocument(encrypted1.encrypted, encrypted1.iv, encrypted1.authTag);
      const decrypted2 = decryptDocument(encrypted2.encrypted, encrypted2.iv, encrypted2.authTag);

      expect(decrypted1.toString()).toBe('Document 1 content');
      expect(decrypted2.toString()).toBe('Document 2 content');
    });
  });
});
