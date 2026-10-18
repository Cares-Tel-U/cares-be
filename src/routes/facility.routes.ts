import { Router } from 'express';
import { getFacilities, createFacility } from '../controllers/facility.controller';
import { authenticateToken, adminMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', getFacilities);
router.post('/', authenticateToken, adminMiddleware, createFacility);

export default router;