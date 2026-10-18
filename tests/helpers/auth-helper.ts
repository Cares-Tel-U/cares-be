import jwt from 'jsonwebtoken';
import { mockUsers } from '../fixtures/users.fixture';

const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_cares_super_key_2026';

export const createTestToken = (payload: { id: string; role: string; email?: string }): string => {
  return jwt.sign(
    {
      id: payload.id,
      userId: payload.id,
      role: payload.role,
      email: payload.email,
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

export const getAuthHeaders = (userType: 'mahasiswa' | 'sarpras' | 'admin' = 'mahasiswa') => {
  const user = mockUsers[userType];
  const token = createTestToken({ id: user.id, role: user.role, email: user.email });
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const getExpiredToken = (): string => {
  return jwt.sign(
    { id: 'expired-user', userId: 'expired-user', role: 'MAHASISWA' },
    JWT_SECRET,
    { expiresIn: '-1s' }
  );
};

export const getInvalidSignatureToken = (): string => {
  return jwt.sign(
    { id: 'fake-user', userId: 'fake-user', role: 'MAHASISWA' },
    'wrong-unauthorized-secret-key-12345'
  );
};
