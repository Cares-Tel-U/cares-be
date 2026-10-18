import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

// 1. Get List Notifikasi User (Use Case No. 9)
export const getUserNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID tidak ditemukan.',
      });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Berhasil mengambil daftar notifikasi',
      data: notifications,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil notifikasi',
      error,
    });
  }
};

// 2. Tandai Notifikasi Telah Dibaca (Use Case No. 9)
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'ID notifikasi wajib diisi.',
      });
    }

    const existingNotif = await prisma.notification.findUnique({
      where: { id: String(id) },
    });

    if (!existingNotif || (userId && existingNotif.userId !== userId)) {
      return res.status(404).json({
        status: 'error',
        message: 'Notifikasi tidak ditemukan.',
      });
    }

    const notification = await prisma.notification.update({
      where: { id: String(id) },
      data: { isRead: true },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Notifikasi berhasil ditandai telah dibaca',
      data: notification,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memperbarui notifikasi',
      error,
    });
  }
};

// 3. Tandai Semua Notifikasi Telah Dibaca
export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID tidak ditemukan.',
      });
    }

    const updateResult = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Seluruh notifikasi berhasil ditandai telah dibaca',
      data: {
        updatedCount: updateResult.count,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memperbarui seluruh notifikasi',
      error,
    });
  }
};