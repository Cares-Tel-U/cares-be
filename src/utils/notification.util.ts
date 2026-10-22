import { PrismaClient } from '@prisma/client';
import { broadcastRealtimeEvent } from './realtime.util';

const prisma = new PrismaClient();

export const createNotification = async (
  userId: string,
  reportId: string,
  pesan: string
) => {
  try {
    // 1. Cek preferensi notifikasi pengguna jika tersedia di database
    let isNotifEnabled = true;
    try {
      if (prisma.user && typeof prisma.user.findUnique === 'function') {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { notificationPreference: true },
        });
        if (user && user.notificationPreference === false) {
          isNotifEnabled = false;
        }
      }
    } catch {
      // Abaikan kegagalan baca preferensi pada lingkungan mocking parsial
      isNotifEnabled = true;
    }

    if (!isNotifEnabled) {
      // Pengguna mematikan notifikasi, batalkan pembuatan notifikasi baru
      return null;
    }

    const newNotif = await prisma.notification.create({
      data: {
        userId,
        reportId,
        pesan,
      },
    });

    try {
      broadcastRealtimeEvent({
        type: 'NOTIFICATION_CREATED',
        data: {
          id: newNotif?.id,
          userId,
          reportId,
          pesan,
        },
      });
    } catch {
      // Penyiaran realtime tidak boleh menggagalkan alur utama
    }

    return newNotif;
  } catch (error) {
    console.error('Gagal membuat notifikasi:', error);
  }
};