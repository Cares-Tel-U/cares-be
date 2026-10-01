import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createNotification = async (
  userId: string,
  reportId: string,
  pesan: string
) => {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        reportId,
        pesan,
      },
    });
  } catch (error) {
    console.error('Gagal membuat notifikasi:', error);
  }
};