import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Interface AuthRequest yang fleksibel membaca id/userId
export interface AuthRequest extends Request {
  user?: {
    id?: string;
    userId?: string;
    role: string;
  };
}

// 1. Middleware Verifikasi Token Login User
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak. Token tidak ditemukan.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      id?: string;
      userId?: string;
      role: string;
    };
    req.user = verified;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token tidak valid atau sudah kadaluwarsa.' });
  }
};

// 2. Middleware Khusus Role Admin/Sarpras (Mendukung SARPRAS & ADMIN)
export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.role !== 'SARPRAS' && req.user.role !== 'ADMIN')) {
    return res.status(403).json({ message: 'Akses ditolak. Fitur ini khusus untuk Admin/Sarpras.' });
  }
  next();
};