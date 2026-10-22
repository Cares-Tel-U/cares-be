import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Pastikan folder uploads tersedia
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi penyimpanan disk multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `report-${uniqueSuffix}${ext}`);
  },
});

// Filter tipe file gambar yang diizinkan
const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar dengan format JPEG, JPG, PNG, atau WEBP yang diizinkan.'));
  }
};

// Middleware multer untuk upload bukti foto (maksimal 3 file, maks 5MB per file)
export const uploadReportPhotos = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 3,
  },
  fileFilter,
});

export const upload = uploadReportPhotos;

export const handleUploadReportPhotos = (req: any, res: any, next: any) => {
  uploadReportPhotos.any()(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            status: 'error',
            message: 'Ukuran foto terlalu besar. Maksimal 5 MB per file.',
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            status: 'error',
            message: 'Jumlah foto melebihi batas. Maksimal 3 file foto.',
          });
        }
        return res.status(400).json({
          status: 'error',
          message: `Gagal mengunggah foto: ${err.message}`,
        });
      }
      return res.status(400).json({
        status: 'error',
        message: err.message || 'Format file foto tidak didukung.',
      });
    }
    next();
  });
};

export const handleUploadAvatar = (req: any, res: any, next: any) => {
  uploadReportPhotos.single('avatar')(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            status: 'error',
            message: 'Ukuran foto avatar terlalu besar. Maksimal 5 MB.',
          });
        }
        return res.status(400).json({
          status: 'error',
          message: `Gagal mengunggah foto avatar: ${err.message}`,
        });
      }
      return res.status(400).json({
        status: 'error',
        message: err.message || 'Format file foto avatar tidak didukung.',
      });
    }

    if (req.file) {
      const MIN_AVATAR_SIZE = 5 * 1024; // 5 KB
      if (req.file.size < MIN_AVATAR_SIZE) {
        try {
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
        } catch {
          // Abaikan kesalahan penghapusan sementara
        }
        return res.status(400).json({
          status: 'error',
          message: 'Ukuran foto avatar terlalu kecil. Minimal 5 KB.',
        });
      }
    }

    next();
  });
};

