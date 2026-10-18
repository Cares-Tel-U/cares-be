import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { mockUsers } from '../fixtures/users.fixture';
import { mockFacilities } from '../fixtures/facilities.fixture';
import { mockReports } from '../fixtures/reports.fixture';
import { getAuthHeaders } from '../helpers/auth-helper';

const { mockPrisma } = vi.hoisted(() => {
  return {
    mockPrisma: {
      facility: {
        findUnique: vi.fn(),
      },
      report: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
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
    facility = mockPrisma.facility;
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
  };
});

import app from '../../src/app';

describe('Report API Tests (/api/v1/reports/*)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v1/reports', () => {
    it('should create a new report successfully with 201 status and trigger notification', async () => {
      mockPrisma.facility.findUnique.mockResolvedValue(mockFacilities.kelas);
      mockPrisma.report.findFirst.mockResolvedValue(null); // No existing active report
      mockPrisma.report.count.mockResolvedValue(0); // 0 reports created today
      mockPrisma.report.create.mockResolvedValue({
        ...mockReports.pendingReport,
        id: 'new-rep-1',
      });
      mockPrisma.notification.create.mockResolvedValue({});

      const res = await request(app)
        .post('/api/v1/reports')
        .set(getAuthHeaders('mahasiswa'))
        .send({
          judul: 'Lampu Kelas Rusak',
          deskripsi: 'Lampu berkedip terus menerus.',
          facilityId: mockFacilities.kelas.id,
          isAnonymous: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id).toBe('new-rep-1');
      expect(mockPrisma.notification.create).toHaveBeenCalled();
    });

    it('should create an anonymous report when isAnonymous is true', async () => {
      mockPrisma.facility.findUnique.mockResolvedValue(mockFacilities.toilet);
      mockPrisma.report.findFirst.mockResolvedValue(null);
      mockPrisma.report.count.mockResolvedValue(1);
      mockPrisma.report.create.mockResolvedValue({
        ...mockReports.anonymousReport,
        id: 'anon-rep-1',
      });
      mockPrisma.notification.create.mockResolvedValue({});

      const res = await request(app)
        .post('/api/v1/reports')
        .set(getAuthHeaders('mahasiswa'))
        .send({
          judul: 'Pintu Rusak',
          deskripsi: 'Kunci pintu macet',
          facilityId: mockFacilities.toilet.id,
          isAnonymous: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(mockPrisma.report.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isAnonymous: true }),
        })
      );
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/reports')
        .set(getAuthHeaders('mahasiswa'))
        .send({
          judul: 'Judul Saja',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Judul, deskripsi, dan fasilitas wajib diisi.');
    });

    it('should return 404 when the specified facility does not exist', async () => {
      mockPrisma.facility.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/reports')
        .set(getAuthHeaders('mahasiswa'))
        .send({
          judul: 'AC Mati',
          deskripsi: 'AC mati total',
          facilityId: 'nonexistent-fac-id',
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Fasilitas tidak ditemukan.');
    });

    it('should return 400 when facility already has an active report (PENDING / DIPROSES)', async () => {
      mockPrisma.facility.findUnique.mockResolvedValue(mockFacilities.kelas);
      mockPrisma.report.findFirst.mockResolvedValue(mockReports.pendingReport);

      const res = await request(app)
        .post('/api/v1/reports')
        .set(getAuthHeaders('mahasiswa'))
        .send({
          judul: 'Laporan Ganda',
          deskripsi: 'Mencoba membuat laporan kedua pada fasilitas yang sama',
          facilityId: mockFacilities.kelas.id,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Fasilitas ini sedang dalam penanganan atau memiliki laporan aktif');
      expect(mockPrisma.report.create).not.toHaveBeenCalled();
    });

    it('should return 400 when user exceeds daily quota of 3 reports', async () => {
      mockPrisma.facility.findUnique.mockResolvedValue(mockFacilities.kelas);
      mockPrisma.report.findFirst.mockResolvedValue(null);
      mockPrisma.report.count.mockResolvedValue(3); // Already reached 3 reports

      const res = await request(app)
        .post('/api/v1/reports')
        .set(getAuthHeaders('mahasiswa'))
        .send({
          judul: 'Laporan ke-4',
          deskripsi: 'Laporan melebihi batas harian',
          facilityId: mockFacilities.kelas.id,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('melebihi batas maksimal 3 laporan harian');
      expect(mockPrisma.report.create).not.toHaveBeenCalled();
    });

    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/reports')
        .send({
          judul: 'No Auth',
          deskripsi: 'Deskripsi',
          facilityId: 'fac-1',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/reports (Public Feed)', () => {
    it('should return list of reports and mask user for anonymous report for regular user', async () => {
      mockPrisma.report.count.mockResolvedValue(1);
      mockPrisma.report.findMany.mockResolvedValue([mockReports.anonymousReport]);

      const res = await request(app)
        .get('/api/v1/reports')
        .set(getAuthHeaders('mahasiswa'));

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data[0].user.nama).toBe('Anonim');
      expect(res.body.data[0].user.id).toBe('anonymous');
    });

    it('should not mask user identity for anonymous report when requester is SARPRAS', async () => {
      mockPrisma.report.count.mockResolvedValue(1);
      mockPrisma.report.findMany.mockResolvedValue([mockReports.anonymousReport]);

      const res = await request(app)
        .get('/api/v1/reports')
        .set(getAuthHeaders('sarpras'));

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data[0].user.nama).toBe(mockUsers.mahasiswa.nama);
    });

    it('should support pagination metadata when page and limit query params are provided', async () => {
      mockPrisma.report.count.mockResolvedValue(25);
      mockPrisma.report.findMany.mockResolvedValue([mockReports.pendingReport]);

      const res = await request(app)
        .get('/api/v1/reports?page=2&per_page=5')
        .set(getAuthHeaders('mahasiswa'));

      expect(res.status).toBe(200);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.page).toBe(2);
      expect(res.body.meta.per_page).toBe(5);
      expect(res.body.meta.total).toBe(25);
      expect(res.body.meta.total_pages).toBe(5);
    });
  });

  describe('GET /api/v1/reports/my-reports', () => {
    it('should return reports belonging to the authenticated user', async () => {
      mockPrisma.report.count.mockResolvedValue(1);
      mockPrisma.report.findMany.mockResolvedValue([mockReports.pendingReport]);

      const res = await request(app)
        .get('/api/v1/reports/my-reports')
        .set(getAuthHeaders('mahasiswa'));

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data[0].id).toBe(mockReports.pendingReport.id);
      expect(mockPrisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: mockUsers.mahasiswa.id }),
        })
      );
    });

    it('should return 401 when unauthorized', async () => {
      const res = await request(app).get('/api/v1/reports/my-reports');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/reports/:id', () => {
    it('should return 200 and report detail for existing report', async () => {
      mockPrisma.report.findUnique.mockResolvedValue(mockReports.pendingReport);

      const res = await request(app)
        .get(`/api/v1/reports/${mockReports.pendingReport.id}`)
        .set(getAuthHeaders('mahasiswa'));

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id).toBe(mockReports.pendingReport.id);
    });

    it('should return 404 when report does not exist', async () => {
      mockPrisma.report.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/reports/nonexistent-id')
        .set(getAuthHeaders('mahasiswa'));

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Laporan tidak ditemukan.');
    });

    it('should mask user info for anonymous report when viewed by regular user', async () => {
      mockPrisma.report.findUnique.mockResolvedValue(mockReports.anonymousReport);

      const res = await request(app)
        .get(`/api/v1/reports/${mockReports.anonymousReport.id}`)
        .set(getAuthHeaders('mahasiswa'));

      expect(res.status).toBe(200);
      expect(res.body.data.user.nama).toBe('Anonim');
      expect(res.body.data.user.email).toBe('hidden@anonymous.local');
    });
  });
});
