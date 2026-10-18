import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword, generateToken, verifyToken } from '../../../src/utils/auth';

describe('Auth Utility Tests (src/utils/auth.ts)', () => {
  describe('hashPassword & comparePassword', () => {
    it('should correctly hash password and return matching comparison for correct password', async () => {
      const rawPassword = 'StrongPassword123!';
      const hashedPassword = await hashPassword(rawPassword);

      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
      expect(hashedPassword).not.toEqual(rawPassword);

      const isValid = await comparePassword(rawPassword, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should return false when comparing with an incorrect password', async () => {
      const rawPassword = 'CorrectPassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hashedPassword = await hashPassword(rawPassword);

      const isValid = await comparePassword(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });

    it('should generate different salts for identical passwords', async () => {
      const password = 'IdenticalPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toEqual(hash2);
      expect(await comparePassword(password, hash1)).toBe(true);
      expect(await comparePassword(password, hash2)).toBe(true);
    });
  });

  describe('generateToken & verifyToken', () => {
    it('should generate a valid JWT token containing user id and role', () => {
      const payload = { id: 'user-uuid-123', role: 'MAHASISWA' };
      const token = generateToken(payload);

      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // Standard JWT header.payload.signature

      const decoded = verifyToken(token) as { id: string; role: string };
      expect(decoded.id).toBe(payload.id);
      expect(decoded.role).toBe(payload.role);
    });

    it('should reject invalid or tampered JWT token', () => {
      const token = generateToken({ id: 'user-1', role: 'MAHASISWA' });
      const tamperedToken = `${token}corrupted`;

      expect(() => verifyToken(tamperedToken)).toThrow();
    });
  });
});
