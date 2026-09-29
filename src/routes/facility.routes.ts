import { Router } from 'express';
import { getFacilities } from '../controllers/facility.controller';

const router = Router();

router.get('/', getFacilities);

export default router;