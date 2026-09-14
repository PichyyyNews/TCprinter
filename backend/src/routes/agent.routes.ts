import { Router } from 'express';
import {
  handleDownloadJobPdf,
  handleCompleteJob,
  handleReportJobError,
} from '../controllers/agent.controller';
import { agentAuthMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(agentAuthMiddleware);

router.get('/jobs/:id/download', handleDownloadJobPdf);
router.post('/jobs/:id/complete', handleCompleteJob);
router.post('/jobs/:id/error', handleReportJobError);

export default router;
