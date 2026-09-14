import prisma from '../lib/prisma';
import { logger } from '../lib/logger';
import { WebhookPayload } from '../types/payment.types';
import { dispatchJobToAgent, notifyPaymentConfirmed } from './queue.service';

export async function processBankWebhook(payload: WebhookPayload): Promise<{
  matched: boolean;
  jobId?: string;
  orderCode?: string;
}> {
  const { amount, bank, rawText, timestamp } = payload;
  logger.info(`Received bank webhook: amount=${amount}, bank=${bank}`);

  const now = new Date();

  // Find active PENDING_PAYMENT jobs not expired
  const pendingJobs = await prisma.printJob.findMany({
    where: {
      status: 'PENDING_PAYMENT',
      expiresAt: { gt: now },
    },
    include: {
      targetTray: true,
    },
  });

  // Find job matching exact totalAmount (within 0.005 float precision)
  const matchedJob = pendingJobs.find((j) => Math.abs(j.totalAmount - amount) < 0.005);

  if (!matchedJob) {
    logger.warn(`No pending job matched for incoming payment amount ${amount}`);
    // Log unmatched for bookkeeping
    await prisma.paymentLog.create({
      data: {
        method: 'NOTIFICATION_WEBHOOK',
        bankName: bank || 'UNKNOWN',
        amountReceived: amount,
        rawPayload: JSON.stringify(payload),
        isMatched: false,
      },
    });
    return { matched: false };
  }

  // Update job status to PAID
  const updatedJob = await prisma.printJob.update({
    where: { id: matchedJob.id },
    data: {
      status: 'PAID',
      paidAt: now,
    },
    include: {
      targetTray: true,
    },
  });

  // Log successful payment
  await prisma.paymentLog.create({
    data: {
      jobId: updatedJob.id,
      method: 'NOTIFICATION_WEBHOOK',
      bankName: bank || 'BANK_TRANSFER',
      amountReceived: amount,
      rawPayload: JSON.stringify(payload),
      isMatched: true,
    },
  });

  logger.info(`Payment matched for Job ${updatedJob.id} (${updatedJob.orderCode})`);

  // Notify user via Socket.io
  notifyPaymentConfirmed(updatedJob.id, updatedJob.orderCode, 'Payment verified via bank notification');

  // Dispatch job to print agent
  await dispatchJobToAgent(updatedJob);

  return {
    matched: true,
    jobId: updatedJob.id,
    orderCode: updatedJob.orderCode,
  };
}
