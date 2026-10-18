import { Router } from 'express';
import {
  getAllReportsForAdmin,
  updateReportStatus,
  updateReportsBulkStatus,
  getDashboardStats,
} from '../controllers/admin.controller';
import { authenticateToken, adminMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/reports', authenticateToken, adminMiddleware, getAllReportsForAdmin);
router.patch('/reports/bulk-status', authenticateToken, adminMiddleware, updateReportsBulkStatus);
router.patch('/reports/:id/status', authenticateToken, adminMiddleware, updateReportStatus);
router.get('/stats', authenticateToken, adminMiddleware, getDashboardStats);

export default router;