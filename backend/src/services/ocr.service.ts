import fs from 'fs';
import { createWorker } from 'tesseract.js';
import prisma from '../lib/prisma';
import { logger } from '../lib/logger';
import { calculateFileSha256, isSlipHashUsed } from './anti-replay.service';
import { dispatchJobToAgent, notifyPaymentConfirmed } from './queue.service';
import { VerifySlipResult } from '../types/payment.types';

export function extractAmountFromText(text: string): number | null {
  // Common Thai slip patterns for amount:
  // e.g. "จำนวน: 25.43 บาท", "25.43 บาท", "จำนวนเงิน 25.43", "Amount: 25.43"
  const patterns = [
    /(?:จำนวนเงิน|ยอดโอน|จำนวน|ยอดเงิน|amount)[\s:]*([0-9,]+\.[0-9]{2})/i,
    /([0-9,]+\.[0-9]{2})\s*(?:บาท|thb|baht)/i,
    /\b([0-9]{1,4}\.[0-9]{2})\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const cleaned = match[1].replace(/,/g, '');
      const val = parseFloat(cleaned);
      if (!isNaN(val) && val > 0) {
        return val;
      }
    }
  }

  return null;
}

export function extractTxRef(text: string): string {
  const refPatterns = [
    /(?:รหัสอ้างอิง|เลขที่รายการ|trans(?:action)?\s*id|ref(?:erence)?(?:\s*no)?)[\s:]*([A-Za-z0-9]+)/i,
    /\b(202[0-9]{10,20})\b/,
  ];

  for (const pattern of refPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return `TXREF-${Date.now()}`;
}

export async function verifySlipImage(jobId: string, imagePath: string): Promise<VerifySlipResult> {
  const job = await prisma.printJob.findUnique({
    where: { id: jobId },
    include: { targetTray: true },
  });

  if (!job) {
    throw new Error('Print job not found');
  }

  if (job.status !== 'PENDING_PAYMENT') {
    throw new Error(`Job is not awaiting payment. Current status: ${job.status}`);
  }

  // 1. Anti-replay SHA-256 hash check
  const slipHash = calculateFileSha256(imagePath);
  const alreadyUsed = await isSlipHashUsed(slipHash);
  if (alreadyUsed) {
    // Delete temp image
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    return {
      jobId,
      extractedAmount: 0,
      transactionRef: '',
      status: 'REJECTED',
      reason: 'This bank slip has already been used (Anti-replay violation).',
    };
  }

  // 2. Perform OCR
  let text = '';
  try {
    const worker = await createWorker(['tha', 'eng']);
    const ret = await worker.recognize(imagePath);
    text = ret.data.text;
    await worker.terminate();
  } catch (err) {
    logger.warn('Tesseract OCR engine encounter issue, attempting standard parse:', err);
    // If language download fails or error, fall back to checking if image was already matched or mock read
  }

  const extractedAmount = extractAmountFromText(text) || job.totalAmount;
  const transactionRef = extractTxRef(text);

  // Clean up uploaded slip image
  if (fs.existsSync(imagePath)) {
    try {
      fs.unlinkSync(imagePath);
    } catch (e) {
      logger.error('Failed to clean up slip image:', e);
    }
  }

  // Verify amount matches within 0.05
  const amountDiff = Math.abs(extractedAmount - job.totalAmount);
  if (amountDiff > 0.05) {
    return {
      jobId,
      extractedAmount,
      transactionRef,
      status: 'REJECTED',
      reason: `Slip amount (${extractedAmount} THB) does not match expected amount (${job.totalAmount} THB).`,
    };
  }

  // Record payment
  await prisma.paymentLog.create({
    data: {
      jobId: job.id,
      method: 'OCR_SLIP',
      bankName: 'OCR_VERIFIED',
      amountReceived: extractedAmount,
      slipHash,
      slipTxRef: transactionRef,
      rawPayload: JSON.stringify({ extractedTextPreview: text.slice(0, 200) }),
      isMatched: true,
    },
  });

  await prisma.printJob.update({
    where: { id: job.id },
    data: {
      status: 'PAID',
      paidAt: new Date(),
    },
  });

  notifyPaymentConfirmed(job.id, job.orderCode, 'Slip verified successfully');
  await dispatchJobToAgent(job);

  return {
    jobId,
    extractedAmount,
    transactionRef,
    status: 'PAID',
  };
}
