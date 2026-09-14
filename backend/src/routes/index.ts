import { Router } from 'express';
import jobRoutes from './job.routes';
import paymentRoutes from './payment.routes';
import adminRoutes from './admin.routes';
import agentRoutes from './agent.routes';

const rootRouter = Router();

rootRouter.use('/jobs', jobRoutes);
rootRouter.use('/payments', paymentRoutes);
rootRouter.use('/admin', adminRoutes);
rootRouter.use('/agent', agentRoutes);

rootRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'TCprinter Backend API',
    timestamp: new Date().toISOString(),
  });
});

export default rootRouter;
