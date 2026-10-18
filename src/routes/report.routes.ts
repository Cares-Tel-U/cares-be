import { Router } from 'express';
import { createReport, getMyReports, getReportById } from '../controllers/report.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { handleUploadReportPhotos } from '../middlewares/upload.middleware';

const router = Router();

// Semua rute laporan butuh autentikasi token
router.post('/', authenticateToken, handleUploadReportPhotos, createReport);
router.get('/my-reports', authenticateToken, getMyReports);
router.get('/:id', authenticateToken, getReportById);

export default router;