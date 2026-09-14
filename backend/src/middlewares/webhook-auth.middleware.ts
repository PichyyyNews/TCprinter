import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.config';
import prisma from '../lib/prisma';

export async function webhookAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const incoming = req.headers['x-webhook-secret'];
  if (!incoming) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing X-Webhook-Secret header',
    });
  }

  // Read from DB first (Admin UI override), fallback to .env
  let expectedSecret = env.WEBHOOK_SECRET;
  try {
    const dbConfig = await prisma.systemConfig.findUnique({
      where: { key: 'webhook_secret' },
    });
    if (dbConfig?.value?.trim()) {
      expectedSecret = dbConfig.value.trim();
    }
  } catch {
    // DB read failure — use env fallback silently
  }

  if (incoming !== expectedSecret) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid X-Webhook-Secret',
    });
  }

  next();
}
