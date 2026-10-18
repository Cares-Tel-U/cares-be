import { Router } from 'express';
import {
  getProfile,
  updateAvatar,
  updateNotificationPreference,
} from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { handleUploadAvatar } from '../middlewares/upload.middleware';

const router = Router();

router.get('/me', authenticateToken, getProfile);
router.patch('/avatar', authenticateToken, handleUploadAvatar, updateAvatar);
router.patch('/notification-preferences', authenticateToken, updateNotificationPreference);

export default router;