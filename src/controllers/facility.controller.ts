import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get All Facilities
export const getFacilities = async (req: Request, res: Response) => {
  try {
    const facilities = await prisma.facility.findMany({
      orderBy: { nama: 'asc' },
    });
    return res.status(200).json({
      status: 'success',
      message: 'Berhasil mengambil data fasilitas',
      data: facilities,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data fasilitas',
      error,
    });
  }
};