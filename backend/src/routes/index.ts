// backend/src/routes/index.ts
import { Router } from 'express';

const rootRouter = Router();

// Sub-routes will be mounted here in Phase 2:
// rootRouter.use('/jobs', jobRoutes);
// rootRouter.use('/payments', paymentRoutes);
// rootRouter.use('/admin', adminRoutes);
// rootRouter.use('/agent', agentRoutes);

rootRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'TCprinter Backend API', timestamp: new Date().toISOString() });
});

export default rootRouter;
