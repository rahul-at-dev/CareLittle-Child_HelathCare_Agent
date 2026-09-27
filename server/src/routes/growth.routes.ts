import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validateChildOwnership } from '../middleware/childOwnership.js';
import { createGrowthRecord, getGrowthRecords } from '../controllers/growth.controller.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(validateChildOwnership);

router.post('/', createGrowthRecord);
router.get('/', getGrowthRecords);

export default router;
