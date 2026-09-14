import crypto from 'crypto';
import fs from 'fs';
import prisma from '../lib/prisma';
import { logger } from '../lib/logger';

export function calculateFileSha256(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

export function calculatePayloadSha256(payload: string): string {
  const hashSum = crypto.createHash('sha256');
  hashSum.update(payload);
  return hashSum.digest('hex');
}

export async function isSlipHashUsed(slipHash: string): Promise<boolean> {
  const existing = await prisma.paymentLog.findUnique({
    where: { slipHash },
  });
  if (existing) {
    logger.warn(`Slip replay attempt detected with hash: ${slipHash}`);
    return true;
  }
  return false;
}
