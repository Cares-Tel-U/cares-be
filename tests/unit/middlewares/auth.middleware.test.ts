import { describe, it, expect, vi } from 'vitest';
import { authenticateToken, adminMiddleware, AuthRequest } from '../../../src/middlewares/auth.middleware';
import { createTestToken, getExpiredToken } from '../../helpers/auth-helper';
import { Response, NextFunction } from 'express';

describe('Auth Middleware Tests (src/middlewares/auth.middleware.ts)', () => {
  const createMockRes = () => {
    const res: Partial<Response> = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res as Response;
  };

  const createMockNext = () => vi.fn() as NextFunction;

  describe('authenticateToken', () => {
    it('should return 401 if Authorization header is missing', () => {
      const req = { headers: {} } as AuthRequest;
      const res = createMockRes();
      const next = createMockNext();

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Akses ditolak. Token tidak ditemukan.' })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if Authorization header is malformed (no token)', () => {
      const req = { headers: { authorization: 'Bearer ' } } as AuthRequest;
      const res = createMockRes();
      const next = createMockNext();

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if token has invalid signature or is tampered', () => {
      const req = { headers: { authorization: 'Bearer invalid.tampered.token' } } as AuthRequest;
      const res = createMockRes();
      const next = createMockNext();

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Token tidak valid atau sudah kadaluwarsa.' })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if token is expired', () => {
      const expiredToken = getExpiredToken();
      const req = { headers: { authorization: `Bearer ${expiredToken}` } } as AuthRequest;
      const res = createMockRes();
      const next = createMockNext();

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should attach decoded user to req.user and call next() on valid token', () => {
      const token = createTestToken({ id: 'user-valid-1', role: 'MAHASISWA' });
      const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;
      const res = createMockRes();
      const next = createMockNext();

      authenticateToken(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user?.id).toBe('user-valid-1');
      expect(req.user?.role).toBe('MAHASISWA');
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('adminMiddleware', () => {
    it('should return 403 if req.user is undefined', () => {
      const req = {} as AuthRequest;
      const res = createMockRes();
      const next = createMockNext();

      adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Akses ditolak. Fitur ini khusus untuk Admin/Sarpras.' })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 for MAHASISWA role', () => {
      const req = { user: { id: 'u1', role: 'MAHASISWA' } } as AuthRequest;
      const res = createMockRes();
      const next = createMockNext();

      adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 for DOSEN role', () => {
      const req = { user: { id: 'u2', role: 'DOSEN' } } as AuthRequest;
      const res = createMockRes();
      const next = createMockNext();

      adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow access and call next() for SARPRAS role', () => {
      const req = { user: { id: 'u3', role: 'SARPRAS' } } as AuthRequest;
      const res = createMockRes();
      const next = createMockNext();

      adminMiddleware(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should allow access and call next() for ADMIN role', () => {
      const req = { user: { id: 'u4', role: 'ADMIN' } } as AuthRequest;
      const res = createMockRes();
      const next = createMockNext();

      adminMiddleware(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
