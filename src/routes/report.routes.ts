import { Router } from 'express';
import { createReport, getMyReports, getReportById } from '../controllers/report.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware'; // Import middleware upload jika ada

const router = Router();

// Semua rute laporan membutuhkan autentikasi token
router.post('/', authenticateToken, upload.array('photos', 3), createReport);
router.get('/my-reports', authenticateToken, getMyReports);
router.get('/:id', authenticateToken, getReportById);

export default router;