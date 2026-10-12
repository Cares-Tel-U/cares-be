import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createNotification } from '../utils/notification.util';

const prisma = new PrismaClient();

// 1. Buat Laporan Kerusakan Baru (UC-04)
export const createReport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { judul, deskripsi, facilityId, isAnonymous } = req.body;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID tidak ditemukan.',
      });
    }

    if (!judul || !deskripsi || !facilityId) {
      return res.status(400).json({
        status: 'error',
        message: 'Judul, deskripsi, dan fasilitas wajib diisi.',
      });
    }

    // 1. Validasi Keberadaan Fasilitas
    const facility = await prisma.facility.findUnique({
      where: { id: String(facilityId) },
    });
    if (!facility) {
      return res.status(404).json({
        status: 'error',
        message: 'Fasilitas tidak ditemukan.',
      });
    }

    // 2. Cegah Laporan Duplikat untuk Fasilitas yang Sedang Aktif (TC11)
    const existingActiveReport = await prisma.report.findFirst({
      where: {
        facilityId: String(facilityId),
        status: { in: ['PENDING', 'DIPROSES'] },
      },
    });

    if (existingActiveReport) {
      return res.status(400).json({
        status: 'error',
        message: 'Sudah ada laporan aktif untuk fasilitas ini yang sedang menunggu verifikasi atau diproses.',
      });
    }

    // 3. Kumpulkan URL Foto Bukti dari Files (Multer) maupun Body Payload
    const photoUrls: string[] = [];

    // Dari file fisik yang diunggah
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file: Express.Multer.File) => {
        photoUrls.push(`/uploads/${file.filename}`);
      });
    }

    // Dari payload body (jika mengirim photos atau foto berupa URL/Array)
    const bodyPhotos = req.body.photos || req.body.foto;
    if (bodyPhotos) {
      if (Array.isArray(bodyPhotos)) {
        bodyPhotos.forEach((item) => {
          if (typeof item === 'string' && item.trim()) {
            photoUrls.push(item.trim());
          }
        });
      } else if (typeof bodyPhotos === 'string' && bodyPhotos.trim()) {
        try {
          const parsed = JSON.parse(bodyPhotos);
          if (Array.isArray(parsed)) {
            parsed.forEach((item) => {
              if (typeof item === 'string' && item.trim()) photoUrls.push(item.trim());
            });
          } else {
            photoUrls.push(bodyPhotos.trim());
          }
        } catch {
          photoUrls.push(bodyPhotos.trim());
        }
      }
    }

    const anonymousFlag = isAnonymous === true || isAnonymous === 'true';

    // 4. Simpan Laporan beserta Relasi Foto ke Database
    const report = await prisma.report.create({
      data: {
        judul: String(judul).trim(),
        deskripsi: String(deskripsi).trim(),
        facilityId: String(facilityId),
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

// 2. Ambil Riwayat Laporan Milik User Sendiri (UC-05)
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