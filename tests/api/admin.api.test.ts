import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { mockReports } from '../fixtures/reports.fixture';
import { getAuthHeaders } from '../helpers/auth-helper';

const { mockPrisma } = vi.hoisted(() => {
  return {
    mockPrisma: {
      report: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        count: vi.fn(),
      },
      notification: {
        create: vi.fn(),
      },
    },
  };
});

vi.mock('@prisma/client', () => {
  class MockPrismaClient {
    report = mockPrisma.report;
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
    StatusPelaporan: {
      PENDING: 'PENDING',
      DIPROSES: 'DIPROSES',
      SELESAI: 'SELESAI',
      DITOLAK: 'DITOLAK',
    },
  };
});

import app from '../../src/app';

describe('Admin API Tests (/api/v1/admin/*)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/admin/reports', () => {
    it('should return 200 and all reports for SARPRAS user', async () => {
      mockPrisma.report.count.mockResolvedValue(1);
      mockPrisma.report.findMany.mockResolvedValue([mockReports.pendingReport]);

      const res = await request(app)
        .get('/api/v1/admin/reports')
        .set(getAuthHeaders('sarpras'));

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.length).toBe(1);
    });

    it('should return 200 with pagination when page and limit query parameters are provided', async () => {
      mockPrisma.report.count.mockResolvedValue(1);
      mockPrisma.report.findMany.mockResolvedValue([mockReports.pendingReport]);

      const res = await request(app)
        .get('/api/v1/admin/reports?page=1&limit=10&status=PENDING')
        .set(getAuthHeaders('sarpras'));

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.per_page).toBe(10);
      expect(res.body.meta.total).toBe(1);
    });

    it('should return 403 Forbidden when accessed by MAHASISWA', async () => {
      const res = await request(app)
        .get('/api/v1/admin/reports')
        .set(getAuthHeaders('mahasiswa'));

      expect(res.status).toBe(403);
    });

    it('should return 401 Unauthorized when token is missing', async () => {
      const res = await request(app).get('/api/v1/admin/reports');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/v1/admin/reports/:id/status', () => {
    it('should update status to DIPROSES and send notification', async () => {
      mockPrisma.report.findUnique.mockResolvedValue(mockReports.pendingReport);
      mockPrisma.report.update.mockResolvedValue({
        ...mockReports.pendingReport,
        status: 'DIPROSES',
      });
      mockPrisma.notification.create.mockResolvedValue({});

      const res = await request(app)
        .patch(`/api/v1/admin/reports/${mockReports.pendingReport.id}/status`)
        .set(getAuthHeaders('sarpras'))
        .send({ status: 'DIPROSES' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.status).toBe('DIPROSES');
      expect(mockPrisma.notification.create).toHaveBeenCalled();
    });

    it('should update status to DITOLAK with valid rejectionReason', async () => {
      mockPrisma.report.findUnique.mockResolvedValue(mockReports.pendingReport);
      mockPrisma.report.update.mockResolvedValue({
        ...mockReports.pendingReport,
        status: 'DITOLAK',
        rejectionReason: 'Laporan tidak relevan dengan fasilitas kampus',
      });
      mockPrisma.notification.create.mockResolvedValue({});

      const res = await request(app)
        .patch(`/api/v1/admin/reports/${mockReports.pendingReport.id}/status`)
        .set(getAuthHeaders('sarpras'))
        .send({
          status: 'DITOLAK',
          rejectionReason: 'Laporan tidak relevan dengan fasilitas kampus',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(mockPrisma.report.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'DITOLAK',
            rejectionReason: 'Laporan tidak relevan dengan fasilitas kampus',
          }),
        })
      );
    });

    it('should return 400 when status is DITOLAK but rejectionReason is omitted', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/reports/${mockReports.pendingReport.id}/status`)
        .set(getAuthHeaders('sarpras'))
        .send({ status: 'DITOLAK' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Alasan penolakan wajib diisi');
      expect(mockPrisma.report.update).not.toHaveBeenCalled();
    });

    it('should return 400 when status value is invalid', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/reports/${mockReports.pendingReport.id}/status`)
        .set(getAuthHeaders('sarpras'))
        .send({ status: 'INVALID_STATUS' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Status laporan tidak valid.');
    });

    it('should return 404 when report is not found', async () => {
      mockPrisma.report.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/v1/admin/reports/nonexistent-id/status')
        .set(getAuthHeaders('sarpras'))
        .send({ status: 'DIPROSES' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Laporan tidak ditemukan.');
    });

    it('should return 403 when called by MAHASISWA', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/reports/${mockReports.pendingReport.id}/status`)
        .set(getAuthHeaders('mahasiswa'))
        .send({ status: 'DIPROSES' });

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/admin/reports/bulk-status', () => {
    it('should update multiple reports status in bulk with 200 status', async () => {
      mockPrisma.report.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.report.findMany.mockResolvedValue([
        { id: 'rep-1', userId: 'u1' },
        { id: 'rep-2', userId: 'u2' },
      ]);
      mockPrisma.notification.create.mockResolvedValue({});

      const res = await request(app)
        .patch('/api/v1/admin/reports/bulk-status')
        .set(getAuthHeaders('sarpras'))
        .send({
          reportIds: ['rep-1', 'rep-2'],
          status: 'DIPROSES',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.count).toBe(2);
      expect(mockPrisma.report.updateMany).toHaveBeenCalled();
      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(2);
    });

    it('should return 400 if reportIds is not an array or is empty', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/reports/bulk-status')
        .set(getAuthHeaders('sarpras'))
        .send({
          reportIds: [],
          status: 'DIPROSES',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Daftar ID laporan (reportIds) wajib');
    });

    it('should return 400 if bulk status is DITOLAK but rejectionReason is omitted', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/reports/bulk-status')
        .set(getAuthHeaders('sarpras'))
        .send({
          reportIds: ['rep-1'],
          status: 'DITOLAK',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Alasan penolakan wajib diisi');
    });

    it('should return 400 if bulk status is not a valid status', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/reports/bulk-status')
        .set(getAuthHeaders('sarpras'))
        .send({
          reportIds: ['rep-1'],
          status: 'STATUS_TIDAK_VALID',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Status laporan tidak valid.');
    });
  });

  describe('GET /api/v1/admin/stats', () => {
    it('should return summary counts and chart data with 200 status', async () => {
      mockPrisma.report.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(3)  // pending
        .mockResolvedValueOnce(4)  // diproses
        .mockResolvedValueOnce(2)  // selesai
        .mockResolvedValueOnce(1); // ditolak

      mockPrisma.report.findMany.mockResolvedValue([
        { createdAt: new Date('2026-01-01T10:00:00.000Z') },
        { createdAt: new Date('2026-01-01T12:00:00.000Z') },
        { createdAt: new Date('2026-01-02T09:00:00.000Z') },
      ]);

      const res = await request(app)
        .get('/api/v1/admin/stats?timeframe=weekly')
        .set(getAuthHeaders('sarpras'));

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.summary.total).toBe(10);
      expect(res.body.data.summary.pending).toBe(3);
      expect(res.body.data.summary.inProgress).toBe(4);
      expect(res.body.data.summary.completed).toBe(2);
      expect(res.body.data.summary.rejected).toBe(1);
      expect(Array.isArray(res.body.data.chartData)).toBe(true);
    });

    it('should return 403 Forbidden for MAHASISWA', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set(getAuthHeaders('mahasiswa'));

      expect(res.status).toBe(403);
    });
  });
});
