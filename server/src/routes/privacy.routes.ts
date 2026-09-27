import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getPrivacyConsent, updatePrivacyConsent, deleteAccountData } from '../controllers/privacy.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/consent', getPrivacyConsent);
router.post('/consent', updatePrivacyConsent);
router.delete('/account', deleteAccountData);

export default router;
