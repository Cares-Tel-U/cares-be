import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

// 1. Buat Laporan Kerusakan Baru (UC-04)
export const createReport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { judul, deskripsi, facilityId, isAnonymous } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'User ID tidak ditemukan.' });
    }

    if (!judul || !deskripsi || !facilityId) {
      return res.status(400).json({
        message: 'Judul, deskripsi, dan fasilitas wajib diisi.',
      });
    }

    const report = await prisma.report.create({
      data: {
        judul,
        deskripsi,
        facilityId,
        userId,
        isAnonymous: Boolean(isAnonymous), // Menerima toggle anonim dari FE
      },
      include: {
        facility: true,
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