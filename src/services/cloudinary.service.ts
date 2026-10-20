import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Direktori lokal untuk fallback penyimpanan berkas
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Memeriksa apakah kredensial Cloudinary telah lengkap dikonfigurasi di environment
 */
export const isCloudinaryConfigured = (): boolean => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

/**
 * Inisialisasi konfigurasi Cloudinary
 */
const initCloudinary = () => {
  if (isCloudinaryConfigured()) {
    cloudinary.config({
      cloud_name: String(process.env.CLOUDINARY_CLOUD_NAME),
      api_key: String(process.env.CLOUDINARY_API_KEY),
      api_secret: String(process.env.CLOUDINARY_API_SECRET),
      secure: true,
    });
  }
};

initCloudinary();

export interface UploadResult {
  url: string;
  publicId?: string;
  storage: 'cloudinary' | 'local';
}

/**
 * Mengunggah berkas foto dari path disk lokal ke Cloudinary atau fallback ke disk lokal
 * @param localFilePath Path absolut berkas di disk lokal
 * @param folderName Folder penyimpanan di Cloudinary
 */
export const uploadFileToStorage = async (
  localFilePath: string,
  folderName: string = process.env.CLOUDINARY_FOLDER || 'cares-damage-reports'
): Promise<UploadResult> => {
  // Jika Cloudinary belum dikonfigurasi, gunakan path lokal
  if (!isCloudinaryConfigured()) {
    const fileName = path.basename(localFilePath);
    return {
      url: `/uploads/${fileName}`,
      storage: 'local',
    };
  }

  try {
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: folderName,
      resource_type: 'image',
    });

    // Hapus berkas lokal sementara setelah berhasil diunggah ke cloud
    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (err) {
        console.warn('Gagal menghapus file lokal sementara:', err);
      }
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
      storage: 'cloudinary',
    };
  } catch (error: any) {
    console.error('Gagal mengunggah berkas ke Cloudinary, beralih ke penyimpanan lokal:', error.message);
    const fileName = path.basename(localFilePath);
    return {
      url: `/uploads/${fileName}`,
      storage: 'local',
    };
  }
};

/**
 * Mengunggah data gambar berbasis base64 atau buffer ke Cloudinary atau disk lokal
 * @param base64Data String data URI (misalnya data:image/jpeg;base64,...)
 * @param customFileName Nama berkas khusus jika disimpan lokal
 * @param folderName Folder tujuan di Cloudinary
 */
export const uploadBase64ToStorage = async (
  base64Data: string,
  customFileName?: string,
  folderName: string = process.env.CLOUDINARY_FOLDER || 'cares-damage-reports'
): Promise<UploadResult> => {
  if (!isCloudinaryConfigured()) {
    // Fallback: Tulis buffer base64 ke disk lokal
    const matches = base64Data.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    const ext = matches && matches[1] === 'jpeg' ? 'jpg' : (matches && matches[1]) || 'jpg';
    const rawData = matches && matches[2] ? matches[2] : base64Data;
    const fileName = customFileName || `report-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
    const destinationPath = path.join(UPLOADS_DIR, fileName);

    fs.writeFileSync(destinationPath, Buffer.from(rawData, 'base64'));
    return {
      url: `/uploads/${fileName}`,
      storage: 'local',
    };
  }

  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: folderName,
      resource_type: 'image',
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      storage: 'cloudinary',
    };
  } catch (error: any) {
    console.error('Gagal mengunggah base64 ke Cloudinary, beralih ke penyimpanan lokal:', error.message);
    const fileName = customFileName || `report-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
    const destinationPath = path.join(UPLOADS_DIR, fileName);
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');

    fs.writeFileSync(destinationPath, Buffer.from(cleanBase64, 'base64'));
    return {
      url: `/uploads/${fileName}`,
      storage: 'local',
    };
  }
};

/**
 * Menghapus berkas dari Cloudinary berdasarkan publicId atau URL
 */
export const deleteFromCloudinary = async (publicIdOrUrl: string): Promise<boolean> => {
  if (!isCloudinaryConfigured() || !publicIdOrUrl) {
    return false;
  }

  try {
    let publicId = publicIdOrUrl;
    if (publicIdOrUrl.startsWith('http')) {
      const parts = publicIdOrUrl.split('/');
      const filenameWithExt = parts.pop() || '';
      const folder = parts.pop() || '';
      const filenameWithoutExt = filenameWithExt.substring(0, filenameWithExt.lastIndexOf('.'));
      publicId = `${folder}/${filenameWithoutExt}`;
    }

    const res = await cloudinary.uploader.destroy(publicId);
    return res.result === 'ok';
  } catch (error) {
    console.error('Gagal menghapus berkas dari Cloudinary:', error);
    return false;
  }
};
