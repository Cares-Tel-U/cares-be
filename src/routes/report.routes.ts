import { Router } from 'express';
import { createReport, getMyReports } from '../controllers/report.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Semua rute laporan butuh autentikasi token
router.post('/', authenticateToken, createReport);
router.get('/my-reports', authenticateToken, getMyReports);

export default router;