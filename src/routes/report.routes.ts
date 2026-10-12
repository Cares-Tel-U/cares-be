import { Router } from 'express';
import { createReport, getMyReports } from '../controllers/report.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { handleUploadReportPhotos } from '../middlewares/upload.middleware';

const router = Router();

// Semua rute laporan butuh autentikasi token
router.post('/', authenticateToken, handleUploadReportPhotos, createReport);
router.get('/my-reports', authenticateToken, getMyReports);

export default router;