import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createNotification } from '../utils/notification.util';
import { broadcastRealtimeEvent } from '../utils/realtime.util';
import { uploadFileToStorage, uploadBase64ToStorage } from '../services/cloudinary.service';

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
        completionPhotos: true,
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
    const { status, rejectionReason, catatan, completionNote } = req.body;

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

    const existingReport = await prisma.report.findUnique({
      where: { id: String(id) },
    });

    if (!existingReport) {
      return res.status(404).json({
        status: 'error',
        message: 'Laporan tidak ditemukan.',
      });
    }

    const updateData: any = {
      status,
    };

    // 1. Catat Waktu Tahapan Perubahan Status
    if (status === 'DIPROSES') {
      updateData.diprosesAt = existingReport.diprosesAt || new Date();
    } else if (status === 'SELESAI') {
      if (!existingReport.diprosesAt) {
        updateData.diprosesAt = existingReport.createdAt;
      }
      updateData.selesaiAt = new Date();
      if (catatan || completionNote) {
        updateData.catatan = catatan || completionNote;
      }
    } else if (status === 'DITOLAK') {
      updateData.ditolakAt = new Date();
      if (rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }
    }

    // 2. Simpan Bukti Foto Pengerjaan Selesai jika Status SELESAI
    const completionPhotoUrls: string[] = [];

    // Dari upload berkas fisik Multer (req.files)
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files as Express.Multer.File[]) {
        const uploadResult = await uploadFileToStorage(file.path);
        completionPhotoUrls.push(uploadResult.url);
      }
    }

    // Dari body payload (completionPhotos, proofImages, atau photos)
    const rawProofs = req.body.completionPhotos || req.body.proofImages || req.body.completionProofs || (status === 'SELESAI' ? req.body.photos : null);
    if (rawProofs) {
      const candidates: string[] = [];
      if (Array.isArray(rawProofs)) {
        rawProofs.forEach((p) => {
          if (typeof p === 'string' && p.trim()) candidates.push(p.trim());
        });
      } else if (typeof rawProofs === 'string' && rawProofs.trim()) {
        try {
          const parsed = JSON.parse(rawProofs);
          if (Array.isArray(parsed)) {
            parsed.forEach((p) => {
              if (typeof p === 'string' && p.trim()) candidates.push(p.trim());
            });
          } else {
            candidates.push(rawProofs.trim());
          }
        } catch {
          candidates.push(rawProofs.trim());
        }
      }

      for (const item of candidates) {
        if (item.startsWith('data:image')) {
          const uploaded = await uploadBase64ToStorage(item);
          completionPhotoUrls.push(uploaded.url);
        } else {
          completionPhotoUrls.push(item);
        }
      }
    }

    if (completionPhotoUrls.length > 0) {
      await prisma.completionPhoto.createMany({
        data: completionPhotoUrls.map((url) => ({
          reportId: String(id),
          url,
        })),
      });
    }

    const updatedReport = await prisma.report.update({
      where: { id: String(id) },
      data: updateData,
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

    // Trigger Notifikasi Otomatis ke Pengguna
    const pesanNotif = `Status laporan Anda (#${updatedReport.id.substring(0, 8)}) telah diperbarui menjadi ${status}.`;
    await createNotification(updatedReport.userId, updatedReport.id, pesanNotif);

    try {
      broadcastRealtimeEvent({
        type: 'REPORT_STATUS_CHANGED',
        data: {
          reportId: updatedReport.id,
          userId: updatedReport.userId,
          status: updatedReport.status,
        },
      });
    } catch {
      // Penyiaran realtime tidak menggagalkan response
    }

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
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

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

    // Menghasilkan deret waktu harian lengkap dari startDate hingga hari ini
    const chartData = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - i);
      const dateKey = targetDate.toISOString().slice(0, 10);
      chartData.push({
        date: dateKey,
        count: trendMap[dateKey] ?? 0,
      });
    }

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

// 4. Update Status Laporan Secara Massal / Bulk (TC26)
export const updateReportsBulkStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { reportIds, status, rejectionReason } = req.body;

    if (!Array.isArray(reportIds) || reportIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Daftar ID laporan (reportIds) wajib disertakan dalam bentuk array non-kosong.',
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
        message: 'Alasan penolakan wajib diisi jika laporan ditolak secara massal.',
      });
    }

    const validIds = reportIds.map(String);

    const bulkUpdateData: any = { status };
    if (status === 'DIPROSES') bulkUpdateData.diprosesAt = new Date();
    if (status === 'SELESAI') bulkUpdateData.selesaiAt = new Date();
    if (status === 'DITOLAK') bulkUpdateData.ditolakAt = new Date();
    if (rejectionReason) bulkUpdateData.rejectionReason = rejectionReason;

    const updateResult = await prisma.report.updateMany({
      where: {
        id: { in: validIds },
      },
      data: bulkUpdateData,
    });

    // Kirim notifikasi otomatis ke masing-masing pelapor
    const affectedReports = await prisma.report.findMany({
      where: { id: { in: validIds } },
      select: { id: true, userId: true },
    });

    for (const report of affectedReports) {
      const pesanNotif = `Status laporan Anda (#${report.id.substring(0, 8)}) telah diperbarui menjadi ${status}.`;
      await createNotification(report.userId, report.id, pesanNotif);
    }

    try {
      broadcastRealtimeEvent({
        type: 'REPORT_STATUS_CHANGED',
        data: {
          reportIds: validIds,
          status,
        },
      });
    } catch {
      // Penyiaran realtime tidak menggagalkan response
    }

    return res.status(200).json({
      status: 'success',
      message: `Berhasil memperbarui ${updateResult.count} status laporan menjadi ${status}`,
      data: {
        count: updateResult.count,
        status,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memperbarui status laporan secara massal',
      error,
    });
  }
};