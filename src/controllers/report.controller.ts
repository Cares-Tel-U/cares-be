import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createNotification } from '../utils/notification.util';
import { uploadFileToStorage, uploadBase64ToStorage } from '../services/cloudinary.service';

const prisma = new PrismaClient();

// 1. Buat Laporan Kerusakan Baru (UC-04: Anonim, Upload Foto, & Cek Laporan Ganda)
export const createReport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { judul, deskripsi, facilityId, isAnonymous, namaGedung, namaRuangan } = req.body;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID tidak ditemukan.',
      });
    }

    const trimmedJudul = String(judul || '').trim();
    const trimmedDeskripsi = String(deskripsi || '').trim();
    const trimmedGedung = String(namaGedung || '').trim();
    const trimmedRuangan = String(namaRuangan || '').trim();

    if (!trimmedJudul || !trimmedDeskripsi || (!facilityId && !trimmedRuangan && !trimmedGedung)) {
      return res.status(400).json({
        status: 'error',
        message: 'Judul, deskripsi, dan fasilitas wajib diisi.',
      });
    }

    if (trimmedDeskripsi.length < 10) {
      return res.status(400).json({
        status: 'error',
        message: 'Deskripsi masalah minimal 10 karakter.',
      });
    }

    if (trimmedDeskripsi.length > 1000) {
      return res.status(400).json({
        status: 'error',
        message: 'Deskripsi masalah maksimal 1000 karakter.',
      });
    }

    if (trimmedGedung && (trimmedGedung.length < 3 || trimmedGedung.length > 100)) {
      return res.status(400).json({
        status: 'error',
        message: 'Nama gedung/area harus antara 3 hingga 100 karakter.',
      });
    }

    if (trimmedRuangan && (trimmedRuangan.length < 3 || trimmedRuangan.length > 100)) {
      return res.status(400).json({
        status: 'error',
        message: 'Nama ruangan/lokasi spesifik harus antara 3 hingga 100 karakter.',
      });
    }

    // 1. Validasi / Resolusi Keberadaan Fasilitas
    let resolvedFacilityId = facilityId ? String(facilityId).trim() : '';
    let facility = resolvedFacilityId
      ? await prisma.facility.findUnique({ where: { id: resolvedFacilityId } })
      : null;

    // Jika fasilitas tidak ditemukan atau client mengirim nama gedung / ruangan custom, buat atau hubungkan secara otomatis
    if (!facility && (namaRuangan || namaGedung)) {
      const roomName = String(namaRuangan || 'Ruangan Umum').trim();
      const buildingName = String(namaGedung || 'Area Kampus').trim();

      let existingFacility = await prisma.facility.findFirst({
        where: {
          nama: { equals: roomName, mode: 'insensitive' },
          lokasi: { equals: buildingName, mode: 'insensitive' },
        },
      });

      if (!existingFacility) {
        existingFacility = await prisma.facility.create({
          data: {
            nama: roomName,
            lokasi: buildingName,
            kategori: 'LAINNYA',
          },
        });
      }
      facility = existingFacility;
      resolvedFacilityId = facility.id;
    } else if (!facility) {
      return res.status(404).json({
        status: 'error',
        message: 'Fasilitas tidak ditemukan.',
      });
    }

    // 2. Batasi Pengguna Maksimal 3 Laporan per Hari (FR-RPT-05 / TC16)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayReportsCount = await prisma.report.count({
      where: {
        userId,
        createdAt: { gte: todayStart },
      },
    });

    if (todayReportsCount >= 3) {
      return res.status(400).json({
        status: 'error',
        message: 'Laporan gagal dibuat karena melebihi batas maksimal 3 laporan harian.',
      });
    }

    // 4. Kumpulkan URL Foto Bukti dari Files (Multer) maupun Body Payload
    const photoUrls: string[] = [];

    // Dari file fisik yang diunggah via Multer (disimpan ke Cloudinary atau disk lokal)
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files as Express.Multer.File[]) {
        const uploadResult = await uploadFileToStorage(file.path);
        photoUrls.push(uploadResult.url);
      }
    }

    // Dari payload body (jika mengirim photos atau foto berupa URL/Array atau base64)
    const rawPhotos = req.body.photos || req.body.foto;
    const candidatePhotos: string[] = [];
    if (rawPhotos) {
      if (Array.isArray(rawPhotos)) {
        rawPhotos.forEach((item) => {
          if (typeof item === 'string' && item.trim()) candidatePhotos.push(item.trim());
        });
      } else if (typeof rawPhotos === 'string' && rawPhotos.trim()) {
        try {
          const parsed = JSON.parse(rawPhotos);
          if (Array.isArray(parsed)) {
            parsed.forEach((item) => {
              if (typeof item === 'string' && item.trim()) candidatePhotos.push(item.trim());
            });
          } else {
            candidatePhotos.push(rawPhotos.trim());
          }
        } catch {
          candidatePhotos.push(rawPhotos.trim());
        }
      }
    }

    for (const item of candidatePhotos) {
      // Tolak jika file adalah PDF atau dokumen non-gambar (Poin 7)
      if (item.startsWith('data:application/pdf') || item.toLowerCase().includes('.pdf')) {
        return res.status(400).json({
          status: 'error',
          message: 'Format file tidak didukung. Hanya file gambar (JPG, PNG, WEBP) yang diizinkan.',
        });
      }

      // Jika data base64 image: unggah ke Cloudinary atau simpan buffer ke disk lokal
      if (item.startsWith('data:image/')) {
        const uploadResult = await uploadBase64ToStorage(item);
        photoUrls.push(uploadResult.url);
      } else {
        photoUrls.push(item);
      }
    }

    // Validasi foto: maksimal 3 file foto (Poin 8)
    if (photoUrls.length > 3) {
      return res.status(400).json({
        status: 'error',
        message: 'Jumlah foto melebihi batas. Maksimal 3 file foto.',
      });
    }

    const anonymousFlag = isAnonymous === true || isAnonymous === 'true';

    // 5. Simpan Laporan beserta Relasi Foto ke Database
    const report = await prisma.report.create({
      data: {
        judul: String(judul).trim(),
        deskripsi: String(deskripsi).trim(),
        facilityId: resolvedFacilityId,
        userId,
        isAnonymous: anonymousFlag,
        ...(photoUrls.length > 0 && {
          photos: {
            create: photoUrls.map((url) => ({ url })),
          },
        }),
      },
      include: {
        facility: true,
        photos: true,
        completionPhotos: true,
      },
    });

    // 5. Trigger Notifikasi Konfirmasi Pengiriman Laporan
    await createNotification(
      userId,
      report.id,
      `Laporan kerusakan untuk ${facility.nama} berhasil dikirim dan menunggu verifikasi admin.`
    );

    return res.status(201).json({
      status: 'success',
      message: 'Laporan berhasil dibuat',
      data: report,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal membuat laporan',
      error,
    });
  }
};

// 2. Ambil Daftar Seluruh Laporan Publik (Feed Kampus)
export const getAllPublicReports = async (req: AuthRequest, res: Response) => {
  try {
    const { status, facilityId, page, per_page, limit } = req.query;

    const whereClause: any = {};
    if (status) {
      whereClause.status = String(status);
    }
    if (facilityId) {
      whereClause.facilityId = String(facilityId);
    }

    const isPaginated = page !== undefined || per_page !== undefined || limit !== undefined;
    const pageNum = Math.max(1, parseInt(String(page || 1), 10));
    const limitNum = Math.max(1, parseInt(String(per_page || limit || 10), 10));

    const total = await prisma.report.count({ where: whereClause });

    const reports = await prisma.report.findMany({
      where: whereClause,
      include: {
        facility: true,
        photos: true,
        completionPhotos: true,
        user: {
          select: {
            id: true,
            nama: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      ...(isPaginated && {
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
    });

    const sanitizedReports = reports.map((r) => {
      if (r.isAnonymous && req.user?.role !== 'SARPRAS') {
        return {
          ...r,
          user: {
            id: 'anonymous',
            nama: 'Anonim',
            role: 'MAHASISWA',
          },
        };
      }
      return r;
    });

    const responsePayload: any = {
      status: 'success',
      message: 'Berhasil mengambil daftar laporan publik',
      data: sanitizedReports,
    };

    if (isPaginated) {
      responsePayload.meta = {
        page: pageNum,
        per_page: limitNum,
        total,
        total_pages: Math.ceil(total / limitNum) || 1,
      };
    }

    return res.status(200).json(responsePayload);
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil daftar laporan publik',
      error,
    });
  }
};

// 3. Ambil Riwayat Laporan Milik User Sendiri (UC-05)
export const getMyReports = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID tidak ditemukan.',
      });
    }

    const { status, page, per_page, limit } = req.query;

    const whereClause: any = { userId };
    if (status) {
      whereClause.status = String(status);
    }

    const isPaginated = page !== undefined || per_page !== undefined || limit !== undefined;
    const pageNum = Math.max(1, parseInt(String(page || 1), 10));
    const limitNum = Math.max(1, parseInt(String(per_page || limit || 10), 10));

    const total = await prisma.report.count({ where: whereClause });

    const reports = await prisma.report.findMany({
      where: whereClause,
      include: {
        facility: true,
        photos: true,
        completionPhotos: true,
      },
      orderBy: { createdAt: 'desc' },
      ...(isPaginated && {
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
    });

    const responsePayload: any = {
      status: 'success',
      message: 'Berhasil mengambil riwayat laporan Anda',
      data: reports,
    };

    if (isPaginated) {
      responsePayload.meta = {
        page: pageNum,
        per_page: limitNum,
        total,
        total_pages: Math.ceil(total / limitNum) || 1,
      };
    }

    return res.status(200).json(responsePayload);
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil laporan',
      error,
    });
  }
};

// 3. Ambil Rincian Detail Satu Laporan Spesifik (GET /reports/:id)
export const getReportById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'ID laporan wajib diisi.',
      });
    }

    const report = await prisma.report.findUnique({
      where: { id: String(id) },
      include: {
        facility: true,
        photos: true,
        completionPhotos: true,
        user: {
          select: {
            id: true,
            nama: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Laporan tidak ditemukan.',
      });
    }

    // Jika laporan anonim, sembunyikan info identitas user pelapor untuk publik/user non-SARPRAS
    const responseReport =
      report.isAnonymous && req.user?.role !== 'SARPRAS'
        ? {
            ...report,
            user: {
              ...report.user,
              id: 'anonymous',
              nama: 'Anonim',
              email: 'hidden@anonymous.local',
            },
          }
        : report;

    return res.status(200).json({
      status: 'success',
      message: 'Berhasil mengambil detail laporan',
      data: responseReport,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil detail laporan',
      error,
    });
  }
};