import { Request, Response } from 'express';
import { PrismaClient, KategoriFasilitas } from '@prisma/client';

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

// Create New Facility (Admin / Sarpras)
export const createFacility = async (req: Request, res: Response) => {
  try {
    const { nama, lokasi, kategori } = req.body;

    if (!nama || typeof nama !== 'string' || !nama.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Nama fasilitas wajib diisi.',
      });
    }

    if (!lokasi || typeof lokasi !== 'string' || !lokasi.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Lokasi fasilitas wajib diisi.',
      });
    }

    if (!kategori || typeof kategori !== 'string' || !kategori.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Kategori fasilitas wajib diisi.',
      });
    }

    const normalizedKategori = kategori.trim().toUpperCase();
    const validCategories = Object.values(KategoriFasilitas);

    if (!validCategories.includes(normalizedKategori as KategoriFasilitas)) {
      return res.status(400).json({
        status: 'error',
        message: `Kategori fasilitas tidak valid. Pilih salah satu dari: ${validCategories.join(', ')}`,
      });
    }

    const newFacility = await prisma.facility.create({
      data: {
        nama: nama.trim(),
        lokasi: lokasi.trim(),
        kategori: normalizedKategori as KategoriFasilitas,
      },
    });

    return res.status(201).json({
      status: 'success',
      message: 'Fasilitas berhasil ditambahkan',
      data: newFacility,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal menambahkan fasilitas.',
      error,
    });
  }
};