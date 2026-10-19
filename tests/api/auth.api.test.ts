import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';

const { mockPrisma } = vi.hoisted(() => {
  return {
    mockPrisma: {
      user: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

vi.mock('@prisma/client', () => {
  class MockPrismaClient {
    user = mockPrisma.user;
  }
  return {
    PrismaClient: MockPrismaClient,
    Role: {
      MAHASISWA: 'MAHASISWA',
      TENAGA_KEPENDIDIKAN: 'TENAGA_KEPENDIDIKAN',
      DOSEN: 'DOSEN',
      SARPRAS: 'SARPRAS',
    },
  };
});

import app from '../../src/app';

describe('Auth API Tests (POST /api/v1/auth/* & /auth/*)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully with 201 status', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'new-id',
        email: 'test@telkomuniversity.ac.id',
        nama: 'Tester',
        role: 'MAHASISWA',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@telkomuniversity.ac.id',
          password: 'Password123',
          nama: 'Tester',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('Registrasi berhasil');
      expect(res.body.data.email).toBe('test@telkomuniversity.ac.id');
    });

    it('should reject registration with 400 if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'exists' });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'existing@telkomuniversity.ac.id',
          password: 'Password123',
          nama: 'Tester',
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Email sudah terdaftar.');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should return 500 when database throws an unexpected error', async () => {
      mockPrisma.user.findUnique.mockRejectedValueOnce(new Error('DB Connection Timeout'));

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'error@telkomuniversity.ac.id',
          password: 'Password123',
          nama: 'Tester',
        });

      expect(res.status).toBe(500);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Gagal melakukan registrasi.');
    });

    it('should reject registration with 400 if nama is less than 2 or more than 50 characters', async () => {
      const resShort = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'shortname@telkomuniversity.ac.id',
          password: 'Password123',
          nama: '1',
        });

      expect(resShort.status).toBe(400);
      expect(resShort.body.message).toBe('Nama lengkap wajib memiliki panjang antara 2 hingga 50 karakter.');

      const resLong = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'longname@telkomuniversity.ac.id',
          password: 'Password123',
          nama: 'A'.repeat(51),
        });

      expect(resLong.status).toBe(400);
      expect(resLong.body.message).toBe('Nama lengkap wajib memiliki panjang antara 2 hingga 50 karakter.');
    });

    it('should reject registration with 400 if password does not meet complexity rules', async () => {
      // Tanpa huruf besar
      const resNoUpper = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'noupper@telkomuniversity.ac.id',
          password: 'password123',
          nama: 'Valid Name',
        });

      expect(resNoUpper.status).toBe(400);
      expect(resNoUpper.body.message).toContain('Password wajib minimal 8 karakter');

      // Tanpa angka
      const resNoNum = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'nonum@telkomuniversity.ac.id',
          password: 'PasswordBagus',
          nama: 'Valid Name',
        });

      expect(resNoNum.status).toBe(400);
      expect(resNoNum.body.message).toContain('Password wajib minimal 8 karakter');
    });

    it('should reject registration with 400 if nim is not numeric', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'nimtest@telkomuniversity.ac.id',
          password: 'Password123',
          nama: 'Valid Name',
          nim: '130119ABCD',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('NIM harus berupa angka.');
    });

    it('should reject registration with 400 if nim already exists', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null) // email check passes
        .mockResolvedValueOnce({ id: 'existing-nim-user' }); // nim check fails

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'nimduplicate@telkomuniversity.ac.id',
          password: 'Password123',
          nama: 'Valid Name',
          nim: '1301190001',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('NIM sudah terdaftar.');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should log in successfully with valid credentials and return JWT token', async () => {
      const hashedPassword = await bcrypt.hash('secret123', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id-1',
        email: 'valid@telkomuniversity.ac.id',
        password: hashedPassword,
        nama: 'Valid User',
        role: 'MAHASISWA',
        avatar: null,
        notificationPreference: true,
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'valid@telkomuniversity.ac.id',
          password: 'secret123',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('valid@telkomuniversity.ac.id');
    });

    it('should reject login with 401 when email is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'notfound@telkomuniversity.ac.id',
          password: 'secret123',
        });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Email atau password salah.');
    });

    it('should reject login with 401 when password does not match', async () => {
      const hashedPassword = await bcrypt.hash('actual-password', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id-1',
        email: 'user@telkomuniversity.ac.id',
        password: hashedPassword,
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'user@telkomuniversity.ac.id',
          password: 'wrong-password',
        });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Email atau password salah.');
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should generate password reset token for valid email with 200 status', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-reset-1',
        email: 'reset@telkomuniversity.ac.id',
      });
      mockPrisma.user.update.mockResolvedValue({});

      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'reset@telkomuniversity.ac.id' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.resetToken).toBeDefined();
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it('should return 400 when email field is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Alamat email wajib diisi.');
    });

    it('should return 404 when email does not belong to any account', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'ghost@telkomuniversity.ac.id' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Akun dengan alamat email tersebut tidak ditemukan.');
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    it('should reset password successfully when token is valid and password >= 8 chars', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user-reset-1',
        email: 'reset@telkomuniversity.ac.id',
      });
      mockPrisma.user.update.mockResolvedValue({});

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'valid-reset-token-12345',
          newPassword: 'newSecretPassword123',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toContain('Kata sandi berhasil direset');
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            resetPasswordToken: null,
            resetPasswordExpires: null,
          }),
        })
      );
    });

    it('should return 400 if token or newPassword is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: 'only-token' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Token dan kata sandi baru wajib disertakan.');
    });

    it('should return 400 if newPassword is less than 8 characters', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'some-token',
          newPassword: 'short',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Kata sandi baru minimal 8 karakter.');
    });

    it('should return 400 if reset token is invalid or expired', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'invalid-or-expired-token',
          newPassword: 'validPassword123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Token reset kata sandi tidak valid atau telah kedaluwarsa.');
    });
  });
});
