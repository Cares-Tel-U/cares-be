import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

// 1. Buat Laporan Kerusakan Baru (POST /reports)
export const createReport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { facilityId, deskripsi, isAnonymous } = req.body;

    // Cek apakah ada laporan aktif yang belum selesai di fasilitas yang sama
    const activeReport = await prisma.report.findFirst({
      where: {
        facilityId,
        status: { in: ['PENDING', 'PROSES'] },
      },
    });

    if (activeReport) {
      return res.status(400).json({
        message: 'Sudah ada laporan aktif untuk fasilitas ini yang sedang diproses.',
      });
    }

    // Simpan laporan baru
    const newReport = await prisma.report.create({
      data: {
        facilityId,
        userId: isAnonymous ? null : userId,
        deskripsi,
        isAnonymous: isAnonymous || false,
        status: 'PENDING',
      },
    });

    return res.status(201).json({
      message: 'Laporan kerusakan berhasil dibuat',
      data: newReport,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal membuat laporan', error });
  }
};

// 2. Ambil Riwayat Laporan User (GET /reports/my-reports)
export const getMyReports = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    const reports = await prisma.report.findMany({
      where: { userId },
      include: {
        facility: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      message: 'Berhasil mengambil riwayat laporan',
      data: reports,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal mengambil riwayat laporan', error });
  }
};