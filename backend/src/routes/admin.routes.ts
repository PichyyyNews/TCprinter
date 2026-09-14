import { Router } from 'express';
import {
  handleGetTrays,
  handleUpdateTray,
  handleGetJobs,
  handleGetPricingRules,
  handleUpdatePricingRule,
  handleGetStats,
} from '../controllers/admin.controller';
import { adminAuthMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(adminAuthMiddleware);

router.get('/trays', handleGetTrays);
router.patch('/trays/:id', handleUpdateTray);
router.get('/jobs', handleGetJobs);
router.get('/pricing', handleGetPricingRules);
router.patch('/pricing/:id', handleUpdatePricingRule);
router.get('/stats', handleGetStats);

export default router;
