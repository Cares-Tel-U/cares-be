import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// Mock cloudinary v2
vi.mock('cloudinary', () => {
  return {
    v2: {
      config: vi.fn(),
      uploader: {
        upload: vi.fn(),
        destroy: vi.fn(),
      },
    },
  };
});

import { v2 as cloudinary } from 'cloudinary';
import {
  isCloudinaryConfigured,
  uploadFileToStorage,
  uploadBase64ToStorage,
  deleteFromCloudinary,
} from '../../../src/services/cloudinary.service';

describe('Cloudinary Service Tests (src/services/cloudinary.service.ts)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isCloudinaryConfigured', () => {
    it('harus mengembalikan false jika environment variables belum lengkap', () => {
      expect(isCloudinaryConfigured()).toBe(false);

      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
      expect(isCloudinaryConfigured()).toBe(false);

      process.env.CLOUDINARY_API_KEY = 'test-key';
      expect(isCloudinaryConfigured()).toBe(false);
    });

    it('harus mengembalikan true jika CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET lengkap', () => {
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
      process.env.CLOUDINARY_API_KEY = 'test-key';
      process.env.CLOUDINARY_API_SECRET = 'test-secret';

      expect(isCloudinaryConfigured()).toBe(true);
    });
  });

  describe('uploadFileToStorage', () => {
    it('harus fallback ke penyimpanan lokal jika Cloudinary tidak dikonfigurasi', async () => {
      const dummyPath = path.join(process.cwd(), 'uploads/sample-dummy.jpg');
      const result = await uploadFileToStorage(dummyPath);

      expect(result.storage).toBe('local');
      expect(result.url).toBe('/uploads/sample-dummy.jpg');
      expect(cloudinary.uploader.upload).not.toHaveBeenCalled();
    });

    it('harus mengunggah ke Cloudinary jika dikonfigurasi dan mengembalikan secure_url', async () => {
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
      process.env.CLOUDINARY_API_KEY = 'test-key';
      process.env.CLOUDINARY_API_SECRET = 'test-secret';

      (cloudinary.uploader.upload as any).mockResolvedValueOnce({
        secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/v12345/cares-damage-reports/sample.jpg',
        public_id: 'cares-damage-reports/sample',
      });

      // Buat file dummy sementara di disk untuk diuji
      const tempTestFile = path.join(process.cwd(), 'uploads/test-temp-file.jpg');
      fs.writeFileSync(tempTestFile, 'test image buffer content');

      const result = await uploadFileToStorage(tempTestFile);

      expect(result.storage).toBe('cloudinary');
      expect(result.url).toContain('https://res.cloudinary.com');
      expect(result.publicId).toBe('cares-damage-reports/sample');
      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(tempTestFile, {
        folder: 'cares-damage-reports',
        resource_type: 'image',
      });

      // Verifikasi bahwa berkas sementara lokal telah dihapus
      expect(fs.existsSync(tempTestFile)).toBe(false);
    });

    it('harus fallback ke lokal jika upload ke Cloudinary mengalami error', async () => {
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
      process.env.CLOUDINARY_API_KEY = 'test-key';
      process.env.CLOUDINARY_API_SECRET = 'test-secret';

      (cloudinary.uploader.upload as any).mockRejectedValueOnce(new Error('Koneksi timeout'));

      const dummyPath = path.join(process.cwd(), 'uploads/fallback-error.jpg');
      const result = await uploadFileToStorage(dummyPath);

      expect(result.storage).toBe('local');
      expect(result.url).toBe('/uploads/fallback-error.jpg');
    });
  });

  describe('uploadBase64ToStorage', () => {
    it('harus fallback menyimpan file base64 ke disk lokal jika Cloudinary tidak dikonfigurasi', async () => {
      const base64Data = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
      const result = await uploadBase64ToStorage(base64Data, 'test-b64-local.png');

      expect(result.storage).toBe('local');
      expect(result.url).toBe('/uploads/test-b64-local.png');

      const savedFile = path.join(process.cwd(), 'uploads/test-b64-local.png');
      expect(fs.existsSync(savedFile)).toBe(true);
      // Bersihkan file uji
      fs.unlinkSync(savedFile);
    });

    it('harus mengunggah base64 ke Cloudinary jika dikonfigurasi', async () => {
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
      process.env.CLOUDINARY_API_KEY = 'test-key';
      process.env.CLOUDINARY_API_SECRET = 'test-secret';

      (cloudinary.uploader.upload as any).mockResolvedValueOnce({
        secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/v12345/cares-damage-reports/b64-sample.jpg',
        public_id: 'cares-damage-reports/b64-sample',
      });

      const base64Data = 'data:image/jpeg;base64,dummybase64string';
      const result = await uploadBase64ToStorage(base64Data);

      expect(result.storage).toBe('cloudinary');
      expect(result.url).toContain('https://res.cloudinary.com');
      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(base64Data, {
        folder: 'cares-damage-reports',
        resource_type: 'image',
      });
    });
  });

  describe('deleteFromCloudinary', () => {
    it('harus mengembalikan false jika Cloudinary belum dikonfigurasi', async () => {
      const result = await deleteFromCloudinary('sample-id');
      expect(result).toBe(false);
      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
    });

    it('harus memanggil uploader.destroy dan mengembalikan true jika sukses', async () => {
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
      process.env.CLOUDINARY_API_KEY = 'test-key';
      process.env.CLOUDINARY_API_SECRET = 'test-secret';

      (cloudinary.uploader.destroy as any).mockResolvedValueOnce({ result: 'ok' });

      const result = await deleteFromCloudinary('cares-damage-reports/sample-id');
      expect(result).toBe(true);
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('cares-damage-reports/sample-id');
    });
  });
});
