import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

// 1. Get List Notifikasi User (Use Case No. 9)
export const getUserNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User ID tidak ditemukan.' });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      message: 'Berhasil mengambil daftar notifikasi',
      data: notifications,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal mengambil notifikasi', error });
  }
};

// 2. Tandai Notifikasi Telah Dibaca (Use Case No. 9)
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'ID notifikasi wajib diisi.' });
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return res.status(200).json({
      message: 'Notifikasi berhasil ditandai telah dibaca',
      data: notification,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal memperbarui notifikasi', error });
  }
};