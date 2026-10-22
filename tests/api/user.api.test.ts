import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { mockUsers } from '../fixtures/users.fixture';
import { getAuthHeaders, getExpiredToken } from '../helpers/auth-helper';

const { mockPrisma } = vi.hoisted(() => {
  return {
    mockPrisma: {
      user: {
        findUnique: vi.fn(),
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

describe('User API Tests (GET /api/v1/users/me & PATCH /api/v1/users/*)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/users/me', () => {
    it('should return 200 and the current user profile when authenticated', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUsers.mahasiswa);

      const res = await request(app)
        .get('/api/v1/users/me')
        .set(getAuthHeaders('mahasiswa'));

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.email).toBe(mockUsers.mahasiswa.email);
      expect(res.body.data.nama).toBe(mockUsers.mahasiswa.nama);
    });

    it('should return 401 when Authorization header is absent', async () => {
      const res = await request(app).get('/api/v1/users/me');

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Token tidak ditemukan');
    });

    it('should return 403 when using an expired token', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set({ Authorization: `Bearer ${getExpiredToken()}` });

      expect(res.status).toBe(403);
    });

    it('should return 404 if user no longer exists in database', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/users/me')
        .set(getAuthHeaders('mahasiswa'));

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User tidak ditemukan.');
    });
  });

  describe('PATCH /api/v1/users/avatar', () => {
    it('should update avatar via body avatarUrl with 200 status', async () => {
      mockPrisma.user.update.mockResolvedValue({
        ...mockUsers.mahasiswa,
        avatar: 'https://example.com/photo.png',
      });

      const res = await request(app)
        .patch('/api/v1/users/avatar')
        .set(getAuthHeaders('mahasiswa'))
        .send({ avatarUrl: 'https://example.com/photo.png' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.avatar).toBe('https://example.com/photo.png');
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { avatar: 'https://example.com/photo.png' },
        })
      );
    });

    it('should update avatar via file upload with 200 status', async () => {
      mockPrisma.user.update.mockResolvedValue({
        ...mockUsers.mahasiswa,
        avatar: '/uploads/report-fake.png',
      });

      const validBuffer = Buffer.alloc(6 * 1024, 'a'); // 6 KB

      const res = await request(app)
        .patch('/api/v1/users/avatar')
        .set(getAuthHeaders('mahasiswa'))
        .attach('avatar', validBuffer, {
          filename: 'avatar.png',
          contentType: 'image/png',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it('should return 400 when uploaded avatar file is smaller than 5 KB', async () => {
      const tinyBuffer = Buffer.from('tiny photo content'); // Kurang dari 5 KB

      const res = await request(app)
        .patch('/api/v1/users/avatar')
        .set(getAuthHeaders('mahasiswa'))
        .attach('avatar', tinyBuffer, {
          filename: 'small-avatar.png',
          contentType: 'image/png',
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Ukuran foto avatar terlalu kecil. Minimal 5 KB.');
    });

    it('should return 400 when uploaded avatar file has unsupported format', async () => {
      const textBuffer = Buffer.alloc(6 * 1024, 't');

      const res = await request(app)
        .patch('/api/v1/users/avatar')
        .set(getAuthHeaders('mahasiswa'))
        .attach('avatar', textBuffer, {
          filename: 'not-image.txt',
          contentType: 'text/plain',
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('should return 400 when base64 avatar data is smaller than 5 KB', async () => {
      const tinyBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const res = await request(app)
        .patch('/api/v1/users/avatar')
        .set(getAuthHeaders('mahasiswa'))
        .send({ avatarUrl: tinyBase64 });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Ukuran foto avatar terlalu kecil. Minimal 5 KB.');
    });

    it('should return 400 when base64 avatar has unsupported format (such as SVG)', async () => {
      const svgBase64 = `data:image/svg+xml;base64,${Buffer.alloc(6 * 1024, 's').toString('base64')}`;

      const res = await request(app)
        .patch('/api/v1/users/avatar')
        .set(getAuthHeaders('mahasiswa'))
        .send({ avatarUrl: svgBase64 });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Format file foto avatar tidak didukung');
    });

    it('should update avatar via valid base64 data URL', async () => {
      mockPrisma.user.update.mockResolvedValue({
        ...mockUsers.mahasiswa,
        avatar: '/uploads/report-fake.png',
      });

      const validPngBase64 = `data:image/png;base64,${Buffer.alloc(6 * 1024, 'a').toString('base64')}`;

      const res = await request(app)
        .patch('/api/v1/users/avatar')
        .set(getAuthHeaders('mahasiswa'))
        .send({ avatarUrl: validPngBase64 });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it('should return 400 when neither file nor avatarUrl is provided', async () => {
      const res = await request(app)
        .patch('/api/v1/users/avatar')
        .set(getAuthHeaders('mahasiswa'))
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Berkas gambar avatar atau URL avatar wajib disertakan');
    });

    it('should return 401 when unauthorized', async () => {
      const res = await request(app)
        .patch('/api/v1/users/avatar')
        .send({ avatarUrl: 'https://example.com/photo.png' });

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/v1/users/notification-preferences', () => {
    it('should update notification preference to false with 200 status', async () => {
      mockPrisma.user.update.mockResolvedValue({
        ...mockUsers.mahasiswa,
        notificationPreference: false,
      });

      const res = await request(app)
        .patch('/api/v1/users/notification-preferences')
        .set(getAuthHeaders('mahasiswa'))
        .send({ enabled: false });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toContain('Nonaktif');
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { notificationPreference: false },
        })
      );
    });

    it('should return 400 if enabled is not a boolean', async () => {
      const res = await request(app)
        .patch('/api/v1/users/notification-preferences')
        .set(getAuthHeaders('mahasiswa'))
        .send({ enabled: 'yes' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Field enabled bertipe boolean');
    });

    it('should return 401 if unauthenticated', async () => {
      const res = await request(app)
        .patch('/api/v1/users/notification-preferences')
        .send({ enabled: true });

      expect(res.status).toBe(401);
    });
  });
});
