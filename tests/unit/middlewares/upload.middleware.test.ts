import { describe, it, expect, vi, beforeEach } from 'vitest';
import multer from 'multer';
import {
  handleUploadReportPhotos,
  handleUploadAvatar,
  uploadReportPhotos,
  upload,
} from '../../../src/middlewares/upload.middleware';
import { Request, Response, NextFunction } from 'express';

describe('Upload Middleware Tests (src/middlewares/upload.middleware.ts)', () => {
  const createMockRes = () => {
    const res: Partial<Response> = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res as Response;
  };

  const createMockNext = () => vi.fn() as NextFunction;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('uploadReportPhotos & upload alias', () => {
    it('should export uploadReportPhotos and alias upload', () => {
      expect(uploadReportPhotos).toBeDefined();
      expect(upload).toBe(uploadReportPhotos);
    });
  });

  describe('handleUploadReportPhotos', () => {
    it('should call next() when upload succeeds without errors', () => {
      const mockReq = {} as Request;
      const mockRes = createMockRes();
      const mockNext = createMockNext();

      vi.spyOn(uploadReportPhotos, 'any').mockImplementation(() => {
        return ((_req: any, _res: any, cb: any) => {
          cb(null);
        }) as any;
      });

      handleUploadReportPhotos(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 400 when MulterError LIMIT_FILE_SIZE occurs', () => {
      const mockReq = {} as Request;
      const mockRes = createMockRes();
      const mockNext = createMockNext();

      const multerErr = new multer.MulterError('LIMIT_FILE_SIZE');
      vi.spyOn(uploadReportPhotos, 'any').mockImplementation(() => {
        return ((_req: any, _res: any, cb: any) => {
          cb(multerErr);
        }) as any;
      });

      handleUploadReportPhotos(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Ukuran foto terlalu besar. Maksimal 5 MB per file.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 when MulterError LIMIT_FILE_COUNT occurs', () => {
      const mockReq = {} as Request;
      const mockRes = createMockRes();
      const mockNext = createMockNext();

      const multerErr = new multer.MulterError('LIMIT_FILE_COUNT');
      vi.spyOn(uploadReportPhotos, 'any').mockImplementation(() => {
        return ((_req: any, _res: any, cb: any) => {
          cb(multerErr);
        }) as any;
      });

      handleUploadReportPhotos(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Jumlah foto melebihi batas. Maksimal 3 file foto.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for any other MulterError code', () => {
      const mockReq = {} as Request;
      const mockRes = createMockRes();
      const mockNext = createMockNext();

      const multerErr = new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'extra_field');
      vi.spyOn(uploadReportPhotos, 'any').mockImplementation(() => {
        return ((_req: any, _res: any, cb: any) => {
          cb(multerErr);
        }) as any;
      });

      handleUploadReportPhotos(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: expect.stringContaining('Gagal mengunggah foto:'),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 when custom non-multer error occurs with message', () => {
      const mockReq = {} as Request;
      const mockRes = createMockRes();
      const mockNext = createMockNext();

      const customErr = new Error('Hanya file gambar dengan format JPEG, JPG, PNG, atau WEBP yang diizinkan.');
      vi.spyOn(uploadReportPhotos, 'any').mockImplementation(() => {
        return ((_req: any, _res: any, cb: any) => {
          cb(customErr);
        }) as any;
      });

      handleUploadReportPhotos(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Hanya file gambar dengan format JPEG, JPG, PNG, atau WEBP yang diizinkan.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return default error message when custom error has empty message', () => {
      const mockReq = {} as Request;
      const mockRes = createMockRes();
      const mockNext = createMockNext();

      const emptyErr = new Error('');
      vi.spyOn(uploadReportPhotos, 'any').mockImplementation(() => {
        return ((_req: any, _res: any, cb: any) => {
          cb(emptyErr);
        }) as any;
      });

      handleUploadReportPhotos(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Format file foto tidak didukung.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('handleUploadAvatar', () => {
    it('should call next() when avatar upload succeeds', () => {
      const mockReq = {} as Request;
      const mockRes = createMockRes();
      const mockNext = createMockNext();

      vi.spyOn(uploadReportPhotos, 'single').mockImplementation(() => {
        return ((_req: any, _res: any, cb: any) => {
          cb(null);
        }) as any;
      });

      handleUploadAvatar(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 400 when MulterError LIMIT_FILE_SIZE occurs during avatar upload', () => {
      const mockReq = {} as Request;
      const mockRes = createMockRes();
      const mockNext = createMockNext();

      const multerErr = new multer.MulterError('LIMIT_FILE_SIZE');
      vi.spyOn(uploadReportPhotos, 'single').mockImplementation(() => {
        return ((_req: any, _res: any, cb: any) => {
          cb(multerErr);
        }) as any;
      });

      handleUploadAvatar(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Ukuran foto avatar terlalu besar. Maksimal 5 MB.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for generic MulterError during avatar upload', () => {
      const mockReq = {} as Request;
      const mockRes = createMockRes();
      const mockNext = createMockNext();

      const multerErr = new multer.MulterError('LIMIT_UNEXPECTED_FILE');
      vi.spyOn(uploadReportPhotos, 'single').mockImplementation(() => {
        return ((_req: any, _res: any, cb: any) => {
          cb(multerErr);
        }) as any;
      });

      handleUploadAvatar(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: expect.stringContaining('Gagal mengunggah foto avatar:'),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 when custom error occurs with message during avatar upload', () => {
      const mockReq = {} as Request;
      const mockRes = createMockRes();
      const mockNext = createMockNext();

      const customErr = new Error('Format avatar salah');
      vi.spyOn(uploadReportPhotos, 'single').mockImplementation(() => {
        return ((_req: any, _res: any, cb: any) => {
          cb(customErr);
        }) as any;
      });

      handleUploadAvatar(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Format avatar salah',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return default fallback message when custom error has no message during avatar upload', () => {
      const mockReq = {} as Request;
      const mockRes = createMockRes();
      const mockNext = createMockNext();

      const emptyErr = new Error('');
      vi.spyOn(uploadReportPhotos, 'single').mockImplementation(() => {
        return ((_req: any, _res: any, cb: any) => {
          cb(emptyErr);
        }) as any;
      });

      handleUploadAvatar(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Format file foto avatar tidak didukung.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
