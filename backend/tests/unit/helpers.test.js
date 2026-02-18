const {
  parsePaginationParams,
  omitSensitiveFields,
  generateRandomCode,
} = require('../../src/utils/helpers');

describe('Helpers', () => {
  describe('parsePaginationParams', () => {
    it('should return default values when no params provided', () => {
      const result = parsePaginationParams({});

      expect(result).toEqual({
        page: 1,
        pageSize: 20,
        skip: 0,
        take: 20,
      });
    });

    it('should parse page and pageSize correctly', () => {
      const result = parsePaginationParams({ page: '2', pageSize: '10' });

      expect(result).toEqual({
        page: 2,
        pageSize: 10,
        skip: 10,
        take: 10,
      });
    });

    it('should handle string numbers', () => {
      const result = parsePaginationParams({ page: '3', pageSize: '15' });

      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(15);
      expect(result.skip).toBe(30);
    });

    it('should cap pageSize at 100', () => {
      const result = parsePaginationParams({ pageSize: '500' });

      expect(result.pageSize).toBe(100);
      expect(result.take).toBe(100);
    });

    it('should handle invalid values gracefully', () => {
      const result = parsePaginationParams({ page: 'invalid', pageSize: 'abc' });

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should ensure page is at least 1', () => {
      const result = parsePaginationParams({ page: '0' });

      expect(result.page).toBe(1);
      expect(result.skip).toBe(0);
    });
  });

  describe('omitSensitiveFields', () => {
    it('should remove password field', () => {
      const obj = {
        id: '123',
        email: 'test@test.com',
        password: 'secret123',
      };

      const result = omitSensitiveFields(obj);

      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('id', '123');
      expect(result).toHaveProperty('email', 'test@test.com');
    });

    it('should remove multiple sensitive fields', () => {
      const obj = {
        id: '123',
        password: 'secret',
        resetToken: 'token',
        name: 'Test',
      };

      const result = omitSensitiveFields(obj);

      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('resetToken');
      expect(result).toHaveProperty('id', '123');
      expect(result).toHaveProperty('name', 'Test');
    });

    it('should allow custom fields to omit', () => {
      const obj = {
        id: '123',
        secret: 'value',
        apiKey: 'key123',
      };

      const result = omitSensitiveFields(obj, ['secret', 'apiKey']);

      expect(result).not.toHaveProperty('secret');
      expect(result).not.toHaveProperty('apiKey');
      expect(result).toHaveProperty('id', '123');
    });

    it('should handle null input gracefully', () => {
      const result = omitSensitiveFields(null);
      // Implementation spreads the object, so null becomes empty object
      expect(result).toEqual({});
    });

    it('should handle undefined input gracefully', () => {
      const result = omitSensitiveFields(undefined);
      // Implementation spreads the object, so undefined becomes empty object
      expect(result).toEqual({});
    });
  });

  describe('generateRandomCode', () => {
    it('should generate code of specified length', () => {
      const code = generateRandomCode(6);
      expect(code).toHaveLength(6);
    });

    it('should generate numeric code by default', () => {
      const code = generateRandomCode(8);
      expect(code).toMatch(/^\d+$/);
    });

    it('should generate different codes each time', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateRandomCode(6));
      }
      // Should have generated many unique codes
      expect(codes.size).toBeGreaterThan(50);
    });
  });
});
