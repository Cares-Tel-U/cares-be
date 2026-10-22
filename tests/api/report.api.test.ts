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
        findFirst: vi.fn(),
        create: vi.fn(),
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

    it('should dynamically find or create facility when namaGedung and namaRuangan are provided without facilityId', async () => {
      mockPrisma.facility.findFirst.mockResolvedValue(null);
      mockPrisma.facility.create.mockResolvedValue({
        id: 'new-dynamic-facility',
        nama: 'Ruang 101',
        lokasi: 'Gedung TULT',
        kategori: 'LAINNYA',
      });
      mockPrisma.report.findFirst.mockResolvedValue(null);
      mockPrisma.report.count.mockResolvedValue(0);
      mockPrisma.report.create.mockResolvedValue({
        ...mockReports.pendingReport,
        facilityId: 'new-dynamic-facility',
      });
      mockPrisma.notification.create.mockResolvedValue({});

      const res = await request(app)
        .post('/api/v1/reports')
        .set(getAuthHeaders('mahasiswa'))
        .send({
          judul: 'Proyektor Buram',
          deskripsi: 'Proyektor tidak fokus di kelas',
          namaGedung: 'Gedung TULT',
          namaRuangan: 'Ruang 101',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(mockPrisma.facility.create).toHaveBeenCalledWith({
        data: {
          nama: 'Ruang 101',
          lokasi: 'Gedung TULT',
          kategori: 'LAINNYA',
        },
      });
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

    it('should reject report with 400 if attachment contains PDF file', async () => {
      mockPrisma.facility.findUnique.mockResolvedValue(mockFacilities.kelas);
      mockPrisma.report.findFirst.mockResolvedValue(null);
      mockPrisma.report.count.mockResolvedValue(0);

      const res = await request(app)
        .post('/api/v1/reports')
        .set(getAuthHeaders('mahasiswa'))
        .send({
          judul: 'Laporan Kerusakan',
          deskripsi: 'Deskripsi masalah',
          facilityId: mockFacilities.kelas.id,
          photos: ['data:application/pdf;base64,JVBERi0xLjQK...'],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Hanya file gambar');
    });

    it('should reject report with 400 if photos exceed 3 files', async () => {
      mockPrisma.facility.findUnique.mockResolvedValue(mockFacilities.kelas);
      mockPrisma.report.findFirst.mockResolvedValue(null);
      mockPrisma.report.count.mockResolvedValue(0);

      const res = await request(app)
        .post('/api/v1/reports')
        .set(getAuthHeaders('mahasiswa'))
        .send({
          judul: 'Laporan Kerusakan',
          deskripsi: 'Deskripsi masalah',
          facilityId: mockFacilities.kelas.id,
          photos: [
            '/uploads/foto1.jpg',
            '/uploads/foto2.jpg',
            '/uploads/foto3.jpg',
            '/uploads/foto4.jpg',
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Maksimal 3 file foto');
    });

    it('should auto-create facility when custom room and building are provided', async () => {
      mockPrisma.facility.findUnique.mockResolvedValue(null);
      mockPrisma.facility.findFirst.mockResolvedValueOnce(null); // not found in DB
      mockPrisma.facility.create.mockResolvedValue({
        id: 'new-custom-facility',
        nama: 'TULT-07-14',
        lokasi: 'TULT',
        kategori: 'LAINNYA',
      });
      mockPrisma.report.findFirst.mockResolvedValue(null);
      mockPrisma.report.count.mockResolvedValue(0);
      mockPrisma.report.create.mockResolvedValue({
        ...mockReports.pendingReport,
        id: 'new-rep-custom',
        facilityId: 'new-custom-facility',
      });
      mockPrisma.notification.create.mockResolvedValue({});

      const res = await request(app)
        .post('/api/v1/reports')
        .set(getAuthHeaders('mahasiswa'))
        .send({
          judul: 'Lampu Rusak di TULT-07-14',
          deskripsi: 'Lampu ruang kelas mati total',
          facilityId: 'custom-fac',
          namaRuangan: 'TULT-07-14',
          namaGedung: 'TULT',
          photos: ['/uploads/lampu.jpg'],
        });

      expect(res.status).toBe(201);
      expect(mockPrisma.facility.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nama: 'TULT-07-14',
            lokasi: 'TULT',
          }),
        })
      );
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

    it('should return 500 when database encounters error during GET /reports/:id', async () => {
      mockPrisma.report.findUnique.mockRejectedValue(new Error('DB failure'));

      const res = await request(app)
        .get('/api/v1/reports/some-id')
        .set(getAuthHeaders('mahasiswa'));

      expect(res.status).toBe(500);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Gagal mengambil detail laporan');
    });

    it('should return 500 when database encounters error during GET /reports', async () => {
      mockPrisma.report.findMany.mockRejectedValue(new Error('DB failure'));

      const res = await request(app)
        .get('/api/v1/reports')
        .set(getAuthHeaders('mahasiswa'));

      expect(res.status).toBe(500);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Gagal mengambil daftar laporan publik');
    });

    it('should return 500 when database encounters error during GET /reports/my-reports', async () => {
      mockPrisma.report.findMany.mockRejectedValue(new Error('DB failure'));

      const res = await request(app)
        .get('/api/v1/reports/my-reports')
        .set(getAuthHeaders('mahasiswa'));

      expect(res.status).toBe(500);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Gagal mengambil laporan');
    });
  });
});



