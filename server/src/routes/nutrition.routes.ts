import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validateChildOwnership } from '../middleware/childOwnership.js';
import {
  getNutritionRecords,
  createNutritionRecord,
  updateNutritionRecord,
  deleteNutritionRecord
} from '../controllers/nutrition.controller.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(validateChildOwnership);

router.get('/', getNutritionRecords);
router.post('/', createNutritionRecord);
router.put('/:recordId', updateNutritionRecord);
router.delete('/:recordId', deleteNutritionRecord);

export default router;
