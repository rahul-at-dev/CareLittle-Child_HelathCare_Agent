import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validateChildOwnership } from '../middleware/childOwnership.js';
import { resourceIntensiveLimiter } from '../middleware/rateLimiter.js';
import {
  createSession,
  getSessions,
  getSessionMessages,
  sendMessage,
  deleteSession
} from '../controllers/chat.controller.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(validateChildOwnership);

router.post('/sessions', createSession);
router.get('/sessions', getSessions);
router.get('/sessions/:sessionId/messages', getSessionMessages);
router.post('/sessions/:sessionId/message', resourceIntensiveLimiter, sendMessage);
router.delete('/sessions/:sessionId', deleteSession);

export default router;
