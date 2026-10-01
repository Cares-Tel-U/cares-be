import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

// 1. Register User
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, nama, role } = req.body;

    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email sudah terdaftar.' });
    }

    // Hash password sebelum disimpan
    const hashedPassword = await hashPassword(password);

    // Simpan user baru ke database
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nama,
        role: role || 'MAHASISWA',
      },
      select: {
        id: true,
        email: true,
        nama: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(201).json({
      message: 'Registrasi berhasil',
      data: newUser,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal melakukan registrasi.', error });
  }
};

// 2. Login User
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Cek keberadaan user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    // Verifikasi password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    // Generate JWT Token
    const token = generateToken({ id: user.id, role: user.role });

    return res.status(200).json({
      message: 'Login berhasil',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          nama: user.nama,
          role: user.role,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal melakukan login.', error });
  }
};

// 3. Get Profile User (Protected Route)
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId ?? req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User ID tidak ditemukan.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nama: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    return res.status(200).json({
      message: 'Berhasil mengambil profil user',
      data: user,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal mengambil data profil.', error });
  }
};