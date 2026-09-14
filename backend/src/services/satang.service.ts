import prisma from '../lib/prisma';
import { SATANG_MIN, SATANG_MAX, ORDER_TIMEOUT_SECONDS } from '../config/constants';
import { logger } from '../lib/logger';

/**
 * Allocates an available satang (.01 - .99) for a given integer baseAmount
 * to guarantee unique PromptPay transfer amounts during the active TTL window.
 */
export async function allocateSatangForAmount(baseAmountInteger: number): Promise<number> {
  const now = new Date();
  const cutoffTime = new Date(now.getTime() - ORDER_TIMEOUT_SECONDS * 1000);

  // Find all active PENDING_PAYMENT jobs with the same base amount that haven't expired
  const activeJobs = await prisma.printJob.findMany({
    where: {
      baseAmount: baseAmountInteger,
      status: 'PENDING_PAYMENT',
      expiresAt: { gt: now },
      createdAt: { gte: cutoffTime },
    },
    select: { satangAmount: true },
  });

  const occupiedSatangs = new Set(activeJobs.map((j) => j.satangAmount));

  const availableSatangs: number[] = [];
  for (let s = SATANG_MIN; s <= SATANG_MAX; s++) {
    if (!occupiedSatangs.has(s)) {
      availableSatangs.push(s);
    }
  }

  if (availableSatangs.length === 0) {
    logger.warn(`Satang pool exhausted for base amount ${baseAmountInteger}`);
    throw new Error('All satang slots are currently occupied for this price point. Please retry in a few moments.');
  }

  // Random selection among available satangs for unpredictable allocation
  const randomIndex = Math.floor(Math.random() * availableSatangs.length);
  const selectedSatang = availableSatangs[randomIndex];

  logger.info(`Allocated satang .${selectedSatang.toString().padStart(2, '0')} for base amount ${baseAmountInteger}`);
  return selectedSatang;
}
