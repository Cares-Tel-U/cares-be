import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-default';

// Hash Password
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Verifikasi Password
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Generate JWT Token
export const generateToken = (payload: { id: string; role: string }): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
};

// Verifikasi JWT Token
export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET);
};