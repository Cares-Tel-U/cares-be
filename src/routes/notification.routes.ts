import { Router } from 'express';
import { getUserNotifications, markAsRead, markAllAsRead } from '../controllers/notification.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticateToken, getUserNotifications);
router.patch('/read-all', authenticateToken, markAllAsRead);
router.patch('/:id/read', authenticateToken, markAsRead);

export default router;