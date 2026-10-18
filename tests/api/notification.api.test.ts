import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { mockUsers } from '../fixtures/users.fixture';
import { getAuthHeaders } from '../helpers/auth-helper';

const { mockPrisma } = vi.hoisted(() => {
  return {
    mockPrisma: {
      notification: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
    },
  };
});

vi.mock('@prisma/client', () => {
  class MockPrismaClient {
    notification = mockPrisma.notification;
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

describe('Notification API Tests (/api/v1/notifications/*)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/notifications', () => {
    it('should return 200 and list of user notifications', async () => {
      const mockNotifs = [
        {
          id: 'notif-1',
          pesan: 'Laporan telah diverifikasi',
          isRead: false,
          userId: mockUsers.mahasiswa.id,
          createdAt: new Date(),
        },
      ];
      mockPrisma.notification.findMany.mockResolvedValue(mockNotifs);

      const res = await request(app)
        .get('/api/v1/notifications')
        .set(getAuthHeaders('mahasiswa'));

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.length).toBe(1);
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: mockUsers.mahasiswa.id },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return 401 when unauthorized', async () => {
      const res = await request(app).get('/api/v1/notifications');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/v1/notifications/:id/read', () => {
    it('should mark own notification as read with 200 status', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({
        id: 'notif-1',
        pesan: 'Pesan',
        isRead: false,
        userId: mockUsers.mahasiswa.id,
      });
      mockPrisma.notification.update.mockResolvedValue({
        id: 'notif-1',
        isRead: true,
      });

      const res = await request(app)
        .patch('/api/v1/notifications/notif-1/read')
        .set(getAuthHeaders('mahasiswa'));

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.isRead).toBe(true);
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { isRead: true },
      });
    });

    it('should return 404 when user tries to mark another user notification as read (security isolation)', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({
        id: 'notif-2',
        pesan: 'Pesan user lain',
        isRead: false,
        userId: 'other-user-uuid-999', // Belongs to different user!
      });

      const res = await request(app)
        .patch('/api/v1/notifications/notif-2/read')
        .set(getAuthHeaders('mahasiswa'));

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Notifikasi tidak ditemukan.');
      expect(mockPrisma.notification.update).not.toHaveBeenCalled();
    });

    it('should return 404 when notification does not exist', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/v1/notifications/nonexistent/read')
        .set(getAuthHeaders('mahasiswa'));

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Notifikasi tidak ditemukan.');
    });

    it('should return 401 when unauthorized', async () => {
      const res = await request(app).patch('/api/v1/notifications/notif-1/read');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/v1/notifications/read-all', () => {
    it('should mark all unread notifications of user as read with 200 status', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 });

      const res = await request(app)
        .patch('/api/v1/notifications/read-all')
        .set(getAuthHeaders('mahasiswa'));

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.updatedCount).toBe(5);
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId: mockUsers.mahasiswa.id,
          isRead: false,
        },
        data: { isRead: true },
      });
    });

    it('should return 401 when unauthorized', async () => {
      const res = await request(app).patch('/api/v1/notifications/read-all');
      expect(res.status).toBe(401);
    });
  });
});
