import { prisma } from '../utils/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

export class AuthService {
  static async register(data: { email: string; password: string; nama: string; role?: Role }) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw new Error('Email sudah terdaftar');

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        nama: data.nama,
        role: data.role || Role.MAHASISWA,
      },
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async login(data: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new Error('Email atau password salah');

    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) throw new Error('Email atau password salah');

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    );

    const { password, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
  }
}