import { Router } from 'express';
import { getProfile } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/me', authenticateToken, getProfile);

export default router;