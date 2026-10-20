import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { mockFacilities } from '../fixtures/facilities.fixture';
import { getAuthHeaders } from '../helpers/auth-helper';

const { mockPrisma } = vi.hoisted(() => {
  return {
    mockPrisma: {
      facility: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
    },
  };
});

vi.mock('@prisma/client', () => {
  class MockPrismaClient {
    facility = mockPrisma.facility;
  }
  return {
    PrismaClient: MockPrismaClient,
    Role: {
      MAHASISWA: 'MAHASISWA',
      TENAGA_KEPENDIDIKAN: 'TENAGA_KEPENDIDIKAN',
      DOSEN: 'DOSEN',
      SARPRAS: 'SARPRAS',
    },
    KategoriFasilitas: {
      KELAS: 'KELAS',
      LABORATORIUM: 'LABORATORIUM',
      TOILET: 'TOILET',
      PARKIRAN: 'PARKIRAN',
      KANTIN: 'KANTIN',
      LAINNYA: 'LAINNYA',
    },
  };
});

import app from '../../src/app';

describe('Facility API Tests (GET & POST /api/v1/facilities)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/facilities (Public)', () => {
    it('should return 200 and list of facilities sorted by name', async () => {
      mockPrisma.facility.findMany.mockResolvedValue([
        mockFacilities.kelas,
        mockFacilities.lab,
        mockFacilities.toilet,
      ]);

      const res = await request(app).get('/api/v1/facilities');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(3);
      expect(mockPrisma.facility.findMany).toHaveBeenCalledWith({
        orderBy: { nama: 'asc' },
      });
    });

    it('should return 500 when database fails', async () => {
      mockPrisma.facility.findMany.mockRejectedValue(new Error('DB Timeout'));

      const res = await request(app).get('/api/v1/facilities');

      expect(res.status).toBe(500);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Gagal mengambil data fasilitas');
    });
  });

  describe('POST /api/v1/facilities (Admin/Sarpras Only)', () => {
    it('should create a new facility with 201 status when requested by SARPRAS', async () => {
      mockPrisma.facility.create.mockResolvedValue({
        id: 'new-fac-id',
        nama: 'Gedung Tokong Nanas Lt. 5',
        lokasi: 'Tokong Nanas',
        kategori: 'KELAS',
      });

      const res = await request(app)
        .post('/api/v1/facilities')
        .set(getAuthHeaders('sarpras'))
        .send({
          nama: 'Gedung Tokong Nanas Lt. 5',
          lokasi: 'Tokong Nanas',
          kategori: 'KELAS',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.nama).toBe('Gedung Tokong Nanas Lt. 5');
      expect(mockPrisma.facility.create).toHaveBeenCalled();
    });

    it('should return 403 Forbidden when a MAHASISWA tries to create a facility', async () => {
      const res = await request(app)
        .post('/api/v1/facilities')
        .set(getAuthHeaders('mahasiswa'))
        .send({
          nama: 'Unauthorized Facility',
          lokasi: 'Somewhere',
          kategori: 'KELAS',
        });

      expect(res.status).toBe(403);
      expect(mockPrisma.facility.create).not.toHaveBeenCalled();
    });

    it('should return 401 Unauthorized when token is missing', async () => {
      const res = await request(app)
        .post('/api/v1/facilities')
        .send({
          nama: 'No Auth Facility',
          lokasi: 'Somewhere',
          kategori: 'KELAS',
        });

      expect(res.status).toBe(401);
    });

    it('should return 400 if nama is missing', async () => {
      const res = await request(app)
        .post('/api/v1/facilities')
        .set(getAuthHeaders('sarpras'))
        .send({
          lokasi: 'Tokong Nanas',
          kategori: 'KELAS',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Nama fasilitas wajib diisi.');
    });

    it('should return 400 if lokasi is missing', async () => {
      const res = await request(app)
        .post('/api/v1/facilities')
        .set(getAuthHeaders('sarpras'))
        .send({
          nama: 'Gedung B',
          kategori: 'KELAS',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Lokasi fasilitas wajib diisi.');
    });

    it('should return 400 if kategori is missing', async () => {
      const res = await request(app)
        .post('/api/v1/facilities')
        .set(getAuthHeaders('sarpras'))
        .send({
          nama: 'Gedung B',
          lokasi: 'Lantai 1',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Kategori fasilitas wajib diisi.');
    });

    it('should return 400 if kategori is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/facilities')
        .set(getAuthHeaders('sarpras'))
        .send({
          nama: 'Gedung B',
          lokasi: 'Lantai 1',
          kategori: 'INVALID_CATEGORY',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Kategori fasilitas tidak valid');
    });
  });
});
