import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createChild, getChildren, getChildById, deleteChild } from '../controllers/child.controller.js';

const router = Router();

router.use(requireAuth);
router.post('/', createChild);
router.get('/', getChildren);
router.get('/:childId', getChildById);
router.delete('/:childId', deleteChild);

export default router;
