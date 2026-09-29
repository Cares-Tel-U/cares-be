import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

// 1. Get All Reports
export const getAllReportsForAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;

    const reports = await prisma.report.findMany({
      where: status ? { status: String(status) as any } : {},
      include: {
        facility: true,
        user: {
          select: {
            id: true,
            nama: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      message: 'Berhasil mengambil seluruh data laporan',
      data: reports,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal mengambil data laporan', error });
  }
};

// 2. Update Status Laporan
export const updateReportStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, refectionReason } = req.body;

    // Perbaikan: Gunakan 'DIPROSES' sesuai enum Prisma
    const validStatuses = ['PENDING', 'DIPROSES', 'SELESAI', 'DITOLAK'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Status laporan tidak valid.' });
    }

    if (status === 'DITOLAK' && !refectionReason) {
      return res.status(400).json({
        message: 'Alasan penolakan wajib diisi jika laporan ditolak.',
      });
    }

    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        status,
        ...(refectionReason && { refectionReason }),
      },
    });

    return res.status(200).json({
      message: `Status laporan berhasil diperbarui menjadi ${status}`,
      data: updatedReport,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal memperbarui status laporan', error });
  }
};

// 3. Get Dashboard Stats & Chart Data (Fixed 500 Error)
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const { timeframe } = req.query;

    const totalReports = await prisma.report.count();
    const pendingReports = await prisma.report.count({ where: { status: 'PENDING' } });
    
    // Perbaikan: Pakai 'DIPROSES'
    const inProgressReports = await prisma.report.count({ where: { status: 'DIPROSES' } });
    const completedReports = await prisma.report.count({ where: { status: 'SELESAI' } });
    const rejectedReports = await prisma.report.count({ where: { status: 'DITOLAK' } });

    const days = timeframe === 'monthly' ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const reports = await prisma.report.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Agregasi tren per hari agar grafik terformat rapi
    const trendMap: { [key: string]: number } = {};
    reports.forEach((report) => {
      const dateKey = report.createdAt.toISOString().split('T')[0];
      trendMap[dateKey] = (trendMap[dateKey] || 0) + 1;
    });

    const chartData = Object.keys(trendMap).map((date) => ({
      date,
      count: trendMap[date],
    }));

    return res.status(200).json({
      message: 'Berhasil mengambil data statistik dashboard',
      data: {
        summary: {
          total: totalReports,
          pending: pendingReports,
          inProgress: inProgressReports,
          completed: completedReports,
          rejected: rejectedReports,
        },
        chartData,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal mengambil statistik dashboard', error });
  }
};