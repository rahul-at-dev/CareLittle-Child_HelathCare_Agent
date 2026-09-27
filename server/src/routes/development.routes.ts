import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validateChildOwnership } from '../middleware/childOwnership.js';
import {
  getDevelopmentRecords,
  createDevelopmentRecord,
  updateDevelopmentRecord,
  deleteDevelopmentRecord
} from '../controllers/development.controller.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(validateChildOwnership);

router.get('/', getDevelopmentRecords);
router.post('/', createDevelopmentRecord);
router.put('/:recordId', updateDevelopmentRecord);
router.delete('/:recordId', deleteDevelopmentRecord);

export default router;
