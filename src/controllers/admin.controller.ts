import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createNotification } from '../utils/notification.util';

const prisma = new PrismaClient();

// 1. Get All Reports (Khusus Admin / SARPRAS)
export const getAllReportsForAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { status, page, per_page, limit } = req.query;

    const whereClause: any = status ? { status: String(status) as any } : {};

    const isPaginated = page !== undefined || per_page !== undefined || limit !== undefined;
    const pageNum = Math.max(1, parseInt(String(page || 1), 10));
    const limitNum = Math.max(1, parseInt(String(per_page || limit || 10), 10));

    const total = await prisma.report.count({ where: whereClause });

    const reports = await prisma.report.findMany({
      where: whereClause,
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
        photos: true,
      },
      orderBy: { createdAt: 'desc' },
      ...(isPaginated && {
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
    });

    const sanitizedReports = reports.map((report) => ({
      ...report,
      user: report.isAnonymous
        ? {
            id: 'ANONYMOUS',
            nama: 'Anonim',
            email: 'anonim@telkomuniversity.ac.id',
            role: report.user.role,
          }
        : report.user,
    }));

    const responsePayload: any = {
      status: 'success',
      message: 'Berhasil mengambil seluruh data laporan',
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
      message: 'Gagal mengambil data laporan',
      error,
    });
  }
};

// 2. Update Status Laporan & Trigger Notifikasi Otomatis
export const updateReportStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'ID laporan wajib diisi.',
      });
    }

    const validStatuses = ['PENDING', 'DIPROSES', 'SELESAI', 'DITOLAK'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Status laporan tidak valid.',
      });
    }

    if (status === 'DITOLAK' && !rejectionReason) {
      return res.status(400).json({
        status: 'error',
        message: 'Alasan penolakan wajib diisi jika laporan ditolak.',
      });
    }

    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        status,
        ...(rejectionReason && { rejectionReason }),
      },
    });

    // Trigger Notifikasi Otomatis ke Pengguna
    const pesanNotif = `Status laporan Anda (#${updatedReport.id.substring(0, 8)}) telah diperbarui menjadi ${status}.`;
    await createNotification(updatedReport.userId, updatedReport.id, pesanNotif);

    return res.status(200).json({
      status: 'success',
      message: `Status laporan berhasil diperbarui menjadi ${status}`,
      data: updatedReport,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memperbarui status laporan',
      error,
    });
  }
};

// 3. Get Dashboard Stats & Chart Data
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const { timeframe } = req.query;

    const totalReports = await prisma.report.count();
    const pendingReports = await prisma.report.count({ where: { status: 'PENDING' } });
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

    const trendMap: Record<string, number> = {};
    reports.forEach((report) => {
      const dateKey = report.createdAt.toISOString().slice(0, 10);
      const currentCount = trendMap[dateKey] ?? 0;
      trendMap[dateKey] = currentCount + 1;
    });

    const chartData = Object.keys(trendMap).map((date) => ({
      date,
      count: trendMap[date] ?? 0,
    }));

    return res.status(200).json({
      status: 'success',
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
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil statistik dashboard',
      error,
    });
  }
};