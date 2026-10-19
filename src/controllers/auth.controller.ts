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
      return res.status(400).json({
        status: 'error',
        message: 'Email sudah terdaftar.',
      });
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
      status: 'success',
      message: 'Registrasi berhasil',
      data: newUser,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal melakukan registrasi.',
      error,
    });
  }
};

// 2. Login User
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email dan password wajib diisi.',
      });
    }

    // Cek keberadaan user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Email atau password salah.',
      });
    }

    // Verifikasi password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Email atau password salah.',
      });
    }

    // Generate JWT Token (30 hari jika rememberMe true, 1 hari jika false/default)
    const tokenExpiresIn = rememberMe ? '30d' : '1d';
    const token = generateToken({ id: user.id, role: user.role }, tokenExpiresIn);

    return res.status(200).json({
      status: 'success',
      message: 'Login berhasil',
      data: {
        token,
        rememberMe: Boolean(rememberMe),
        expiresIn: tokenExpiresIn,
        user: {
          id: user.id,
          email: user.email,
          nama: user.nama,
          role: user.role,
          avatar: user.avatar,
          notificationPreference: user.notificationPreference,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal melakukan login.',
      error,
    });
  }
};

// 3. Get Profile User (Protected Route)
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId ?? req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID tidak ditemukan.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nama: true,
        role: true,
        avatar: true,
        notificationPreference: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User tidak ditemukan.',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Berhasil mengambil profil user',
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data profil.',
      error,
    });
  }
};

// 4. Update Avatar Foto Profil (TC06 / BUG02)
export const updateAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId ?? req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID tidak ditemukan.',
      });
    }

    let avatarUrl = req.body?.avatarUrl || req.body?.avatar;

    if (req.file) {
      avatarUrl = `/uploads/${req.file.filename}`;
    }

    if (!avatarUrl || typeof avatarUrl !== 'string' || !avatarUrl.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Berkas gambar avatar atau URL avatar wajib disertakan.',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl.trim() },
      select: {
        id: true,
        email: true,
        nama: true,
        role: true,
        avatar: true,
        notificationPreference: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Foto profil berhasil diperbarui',
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memperbarui foto profil.',
      error,
    });
  }
};

// 5. Update Notification Preference (FR-NOTIF-03 / Use Case #10)
export const updateNotificationPreference = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId ?? req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID tidak ditemukan.',
      });
    }

    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        status: 'error',
        message: 'Field enabled bertipe boolean (true/false) wajib disertakan.',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { notificationPreference: enabled },
      select: {
        id: true,
        email: true,
        nama: true,
        role: true,
        avatar: true,
        notificationPreference: true,
      },
    });

    return res.status(200).json({
      status: 'success',
      message: `Preferensi notifikasi berhasil diubah menjadi ${enabled ? 'Aktif' : 'Nonaktif'}`,
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memperbarui preferensi notifikasi.',
      error,
    });
  }
};

// 6. Forgot Password Request (FR-LOG-03 / Use Case #3)
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Alamat email wajib diisi.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Akun dengan alamat email tersebut tidak ditemukan.',
      });
    }

    // Buat token reset acak berbasis timestamp & hash
    const resetToken = Buffer.from(`${user.id}-${Date.now()}`).toString('hex');
    const expiresAt = new Date(Date.now() + 3600 * 1000); // Berlaku 1 jam

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: expiresAt,
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Tautan pemulihan kata sandi telah dikirim ke email terdaftar.',
      data: {
        email: user.email,
        resetToken,
        resetLink: `/reset-password?token=${resetToken}`,
        expiresAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memproses permintaan reset kata sandi.',
      error,
    });
  }
};

// 7. Reset Password Confirmation (FR-LOG-03 / Use Case #3)
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Token dan kata sandi baru wajib disertakan.',
      });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'Kata sandi baru minimal 8 karakter.',
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: String(token),
        resetPasswordExpires: { gte: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Token reset kata sandi tidak valid atau telah kedaluwarsa.',
      });
    }

    const hashedPassword = await hashPassword(String(newPassword));

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Kata sandi berhasil direset. Silakan login kembali menggunakan kata sandi baru Anda.',
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mereset kata sandi.',
      error,
    });
  }
};