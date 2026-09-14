import { Router } from 'express';
import {
  handleGetPrinters,
  handleCreatePrinter,
  handleUpdatePrinter,
  handleDeletePrinter,
  handleDiscoverPrinters,
  handleGetTrays,
  handleCreateTray,
  handleUpdateTray,
  handleDeleteTray,
  handleGetPricingRules,
  handleCreatePricingRule,
  handleUpdatePricingRule,
  handleDeletePricingRule,
  handleGetJobs,
  handleRetryJob,
  handleCancelJob,
  handleApprovePayment,
  handleGetPayments,
  handleGetNotifications,
  handleTestNotification,
  handleGetAgentStatus,
  handleSetAgentMode,
  handleTriggerTestPrint,
  handleGetConfigs,
  handleUpsertConfig,
  handleDeleteConfig,
  handleGetStats,
} from '../controllers/admin.controller';
import { adminAuthMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(adminAuthMiddleware);

// Printers
router.get('/printers', handleGetPrinters);
router.post('/printers', handleCreatePrinter);
router.get('/printers/discover', handleDiscoverPrinters);
router.put('/printers/:id', handleUpdatePrinter);
router.patch('/printers/:id', handleUpdatePrinter);
router.delete('/printers/:id', handleDeletePrinter);

// Trays
router.get('/trays', handleGetTrays);
router.post('/trays', handleCreateTray);
router.put('/trays/:id', handleUpdateTray);
router.patch('/trays/:id', handleUpdateTray);
router.delete('/trays/:id', handleDeleteTray);

// Pricing Rules
router.get('/pricing', handleGetPricingRules);
router.post('/pricing', handleCreatePricingRule);
router.put('/pricing/:id', handleUpdatePricingRule);
router.patch('/pricing/:id', handleUpdatePricingRule);
router.delete('/pricing/:id', handleDeletePricingRule);

// Jobs Queue
router.get('/jobs', handleGetJobs);
router.post('/jobs/:id/retry', handleRetryJob);
router.post('/jobs/:id/cancel', handleCancelJob);
router.post('/jobs/:id/approve-payment', handleApprovePayment);

// Payments & Notifications
router.get('/payments', handleGetPayments);
router.post('/payments/:id/approve', handleApprovePayment);
router.get('/notifications', handleGetNotifications);
router.post('/notifications/test', handleTestNotification);

// Print Agent
router.get('/agent', handleGetAgentStatus);
router.post('/agent/mode', handleSetAgentMode);
router.post('/agent/test-print', handleTriggerTestPrint);

// System Config & Environment
router.get('/config', handleGetConfigs);
router.post('/config', handleUpsertConfig);
router.put('/config/:key', handleUpsertConfig);
router.delete('/config/:key', handleDeleteConfig);

// Stats
router.get('/stats', handleGetStats);

export default router;
