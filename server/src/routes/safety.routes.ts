import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validateChildOwnership, ChildRequest } from '../middleware/childOwnership.js';
import { resourceIntensiveLimiter } from '../middleware/rateLimiter.js';
import { evaluateSafety } from '../controllers/safety.controller.js';

const router = Router();

router.use(requireAuth);
router.use(resourceIntensiveLimiter);

// Optional child ownership check if childId parameter/body exists
const optionalChildOwnership = (req: ChildRequest, res: Response, next: NextFunction) => {
  if (req.body && req.body.childId) {
    req.params = req.params || {};
    req.params.childId = req.body.childId;
    return validateChildOwnership(req, res, next);
  }
  next();
};

router.post('/evaluate', optionalChildOwnership, evaluateSafety);

export default router;
