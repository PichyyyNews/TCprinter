import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.config';

export function webhookAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const secret = req.headers['x-webhook-secret'];
  if (!secret || secret !== env.WEBHOOK_SECRET) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or missing X-Webhook-Secret',
    });
  }
  next();
}
