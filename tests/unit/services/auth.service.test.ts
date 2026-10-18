import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

const { mockPrisma } = vi.hoisted(() => {
  return {
    mockPrisma: {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    },
  };
});

vi.mock('../../../src/utils/prisma', () => ({
  prisma: mockPrisma,
}));

import { AuthService } from '../../../src/services/auth.service';

describe('Auth Service Tests (src/services/auth.service.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user and omit password in returned data', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'new-user-id',
        email: 'newuser@telkomuniversity.ac.id',
        password: 'hashed-password-123',
        nama: 'New User',
        role: 'MAHASISWA',
      });

      const result = await AuthService.register({
        email: 'newuser@telkomuniversity.ac.id',
        password: 'password123',
        nama: 'New User',
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'newuser@telkomuniversity.ac.id' },
      });
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(result.id).toBe('new-user-id');
      expect(result.email).toBe('newuser@telkomuniversity.ac.id');
      expect((result as any).password).toBeUndefined();
    });

    it('should throw an error if email is already registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-id',
        email: 'duplicate@telkomuniversity.ac.id',
      });

      await expect(
        AuthService.register({
          email: 'duplicate@telkomuniversity.ac.id',
          password: 'password123',
          nama: 'Duplicate User',
        })
      ).rejects.toThrow('Email sudah terdaftar');

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return token and user profile without password on valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('correct-password', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-login-id',
        email: 'login@telkomuniversity.ac.id',
        password: hashedPassword,
        nama: 'Login User',
        role: 'MAHASISWA',
      });

      const result = await AuthService.login({
        email: 'login@telkomuniversity.ac.id',
        password: 'correct-password',
      });

      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(result.user.id).toBe('user-login-id');
      expect((result.user as any).password).toBeUndefined();
    });

    it('should throw an error when email is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        AuthService.login({
          email: 'notfound@telkomuniversity.ac.id',
          password: 'password123',
        })
      ).rejects.toThrow('Email atau password salah');
    });

    it('should throw an error when password does not match', async () => {
      const hashedPassword = await bcrypt.hash('real-password', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'user@telkomuniversity.ac.id',
        password: hashedPassword,
        nama: 'User',
        role: 'MAHASISWA',
      });

      await expect(
        AuthService.login({
          email: 'user@telkomuniversity.ac.id',
          password: 'wrong-password',
        })
      ).rejects.toThrow('Email atau password salah');
    });
  });
});
