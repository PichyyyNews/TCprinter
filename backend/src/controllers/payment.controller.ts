import { Request, Response, NextFunction } from 'express';
import { processBankWebhook } from '../services/webhook.service';
import { verifySlipImage } from '../services/ocr.service';
import { webhookSchema } from '../schemas/payment.schema';

export async function handleBankWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = webhookSchema.parse(req.body);
    const result = await processBankWebhook(validated);
    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleVerifySlip(req: Request, res: Response, next: NextFunction) {
  try {
    const { jobId } = req.body;
    if (!jobId) {
      return res.status(400).json({ success: false, error: 'jobId is required' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'slip image file is required' });
    }

    const result = await verifySlipImage(jobId, req.file.path);
    if (result.status === 'REJECTED') {
      return res.status(400).json({
        success: false,
        error: result.reason || 'Slip verification failed',
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
