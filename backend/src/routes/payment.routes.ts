import { Router } from 'express';
import { handleBankWebhook, handleVerifySlip } from '../controllers/payment.controller';
import { webhookAuthMiddleware } from '../middlewares/webhook-auth.middleware';
import { slipUpload } from '../middlewares/upload.middleware';

const router = Router();

// Flow A: Bank notification webhook with secret key
router.post('/webhook', webhookAuthMiddleware, handleBankWebhook);

// Flow B: OCR slip upload fallback
router.post('/verify-slip', slipUpload.single('slipImage'), handleVerifySlip);

export default router;
