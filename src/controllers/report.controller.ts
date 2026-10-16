import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

// 1. Buat Laporan Kerusakan Baru (UC-04: Anonim, Upload Foto, & Cek Laporan Ganda)
export const createReport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { judul, deskripsi, facilityId, isAnonymous } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!userId) {
      return res.status(401).json({ message: 'User ID tidak ditemukan.' });
    }

    if (!judul || !deskripsi || !facilityId) {
      return res.status(400).json({
        message: 'Judul, deskripsi, dan fasilitas wajib diisi.',
      });
    }

    // CEK LAPORAN GANDA: Cek apakah fasilitas ini masih punya laporan aktif (PENDING / DIPROSES)
    const activeReport = await prisma.report.findFirst({
      where: {
        facilityId,
        status: {
          in: ['PENDING', 'DIPROSES'],
        },
      },
    });

    if (activeReport) {
      return res.status(400).json({
        message: 'Fasilitas ini sedang dalam penanganan atau memiliki laporan aktif yang belum selesai.',
      });
    }

    // Simpan laporan ke database
    const report = await prisma.report.create({
      data: {
        judul,
        deskripsi,
        facilityId,
        userId,
        isAnonymous: isAnonymous === 'true' || isAnonymous === true,
        ...(files?.length
          ? {
              photos: {
                create: files.map((file) => ({
                  url: `/uploads/${file.filename}`,
                })),
              },
            }
          : {}),
      },
      include: {
        facility: true,
        photos: true,
      },
    });

    return res.status(201).json({
      message: 'Laporan berhasil dibuat',
      data: report,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal membuat laporan', error });
  }
};

// 2. Ambil Riwayat Laporan Milik User Sendiri (UC-05)
export const getMyReports = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User ID tidak ditemukan.' });
    }

    const reports = await prisma.report.findMany({
      where: { userId },
      include: {
        facility: true,
        photos: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      message: 'Berhasil mengambil riwayat laporan Anda',
      data: reports,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal mengambil laporan', error });
  }
};

// 3. Ambil Rincian Detail Satu Laporan Spesifik (GET /reports/:id)
export const getReportById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'ID laporan wajib diisi.' });
    }

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        facility: true,
        photos: true,
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
      return res.status(404).json({ message: 'Laporan tidak ditemukan.' });
    }

    // Jika laporan anonim, sembunyikan info identitas user pelapor untuk publik/user lain
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
      message: 'Berhasil mengambil detail laporan',
      data: responseReport,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal mengambil detail laporan', error });
  }
};