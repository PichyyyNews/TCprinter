import fs from 'fs';
import prisma from '../lib/prisma';
import { logger } from '../lib/logger';
import { getIO } from '../sockets';
import { env } from '../config/env.config';
import { ORDER_TIMEOUT_SECONDS } from '../config/constants';
import { calculateJobPrice } from './pricing.service';
import { allocateSatangForAmount } from './satang.service';
import { createPromptPayQr } from './promptpay.service';
import { CreateJobInput, CreateJobResponseData } from '../types/job.types';

export interface CachedQuote {
  quoteId: string;
  fileName: string;
  tempFilePath: string;
  fileSizeBytes: number;
  pageCount: number;
  createdAt: number;
}

const quoteCache = new Map<string, CachedQuote>();

export function storeQuote(quote: CachedQuote): void {
  quoteCache.set(quote.quoteId, quote);
  // Auto cleanup quote cache entry after 30 mins
  setTimeout(() => {
    quoteCache.delete(quote.quoteId);
  }, 30 * 60 * 1000);
}

export function getQuote(quoteId: string): CachedQuote | undefined {
  return quoteCache.get(quoteId);
}

function generateOrderCode(): string {
  const now = new Date();
  const yyyy = now.getFullYear().toString();
  const mm = (now.getMonth() + 1).toString().padStart(2, '0');
  const dd = now.getDate().toString().padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TCP-${yyyy}${mm}${dd}-${rand}`;
}

export async function createPrintJob(input: CreateJobInput): Promise<CreateJobResponseData> {
  const quote = getQuote(input.quoteId);
  if (!quote) {
    throw new Error('Quote has expired or is invalid. Please re-upload your document.');
  }

  // Find suitable active tray
  const trays = await prisma.tray.findMany({
    where: {
      isActive: true,
      paperSize: input.paperSize,
      status: 'OK',
    },
  });

  let selectedTray = trays.find((t) => {
    if (input.isColor) {
      return t.colorCapability === 'COLOR' || t.colorCapability === 'ANY';
    }
    return t.colorCapability === 'MONOCHROME' || t.colorCapability === 'ANY';
  });

  if (!selectedTray && trays.length > 0) {
    selectedTray = trays[0];
  }

  // Calculate pricing
  const { baseAmount } = await calculateJobPrice({
    paperSize: input.paperSize,
    isColor: input.isColor,
    isDuplex: input.isDuplex,
    pageCount: quote.pageCount,
    copies: input.copies,
  });

  // Dynamic satang allocation
  const satangAmount = await allocateSatangForAmount(baseAmount);
  const totalAmount = parseFloat((baseAmount + satangAmount / 100).toFixed(2));

  // PromptPay payload & QR
  const { payload, qrCodeDataUrl } = await createPromptPayQr(env.PROMPTPAY_TARGET, totalAmount);

  const expiresAt = new Date(Date.now() + ORDER_TIMEOUT_SECONDS * 1000);
  const orderCode = generateOrderCode();

  const printJob = await prisma.printJob.create({
    data: {
      orderCode,
      originalFileName: quote.fileName,
      tempFilePath: quote.tempFilePath,
      pageCount: quote.pageCount,
      copies: input.copies,
      pageRange: input.pageRange || 'all',
      paperSize: input.paperSize,
      isColor: input.isColor,
      isDuplex: input.isDuplex,
      duplexEdge: input.duplexEdge || 'NONE',
      targetTrayId: selectedTray?.id,
      baseAmount,
      satangAmount,
      totalAmount,
      promptPayPayload: payload,
      status: 'PENDING_PAYMENT',
      expiresAt,
    },
  });

  logger.info(`Created PrintJob ${printJob.id} (${orderCode}) for amount ${totalAmount} THB`);

  return {
    jobId: printJob.id,
    orderCode: printJob.orderCode,
    pageCount: printJob.pageCount,
    copies: printJob.copies,
    baseAmount: printJob.baseAmount,
    satangAmount: printJob.satangAmount,
    totalAmount: printJob.totalAmount,
    promptPayPayload: printJob.promptPayPayload,
    qrCodeDataUrl,
    expiresAt: expiresAt.toISOString(),
    expiresInSeconds: ORDER_TIMEOUT_SECONDS,
  };
}

export function notifyPaymentConfirmed(jobId: string, orderCode: string, message: string) {
  try {
    const io = getIO();
    io.to(`job:${jobId}`).emit('payment:confirmed', {
      jobId,
      orderCode,
      status: 'PAID',
      confirmedAt: new Date().toISOString(),
      message,
    });
    io.to('kiosk:admin').emit('admin:order_updated', { jobId, orderCode, status: 'PAID' });
  } catch (err) {
    logger.error('Socket notification error (payment:confirmed):', err);
  }
}

export async function dispatchJobToAgent(job: any) {
  try {
    await prisma.printJob.update({
      where: { id: job.id },
      data: { status: 'DISPATCHED' },
    });

    const io = getIO();
    const targetTray = job.targetTray || (await prisma.tray.findUnique({ where: { id: job.targetTrayId } }));

    io.to('kiosk:agent').emit('agent:new_job', {
      jobId: job.id,
      orderCode: job.orderCode,
      downloadToken: env.AGENT_TOKEN,
      printSettings: {
        paperSize: job.paperSize,
        isColor: job.isColor,
        isDuplex: job.isDuplex,
        duplexEdge: job.duplexEdge,
        trayNumber: targetTray?.trayNumber || 1,
        copies: job.copies,
        pageRange: job.pageRange,
      },
    });

    io.to(`job:${job.id}`).emit('job:status_changed', {
      jobId: job.id,
      orderCode: job.orderCode,
      status: 'DISPATCHED',
      message: 'งานพิมพ์ถูกส่งไปยังเครื่องพิมพ์แล้ว',
    });
  } catch (err) {
    logger.error(`Error dispatching job ${job.id} to agent:`, err);
  }
}

export async function completeJob(jobId: string, printedPages: number, executionDurationMs?: number) {
  logger.info(`Completing job ${jobId}, printed ${printedPages} pages in ${executionDurationMs || 0}ms`);
  const job = await prisma.printJob.findUnique({ where: { id: jobId } });
  if (!job) return;

  await prisma.printJob.update({
    where: { id: jobId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  });

  // Deduct paper remaining if targetTray exists
  if (job.targetTrayId) {
    try {
      const tray = await prisma.tray.findUnique({ where: { id: job.targetTrayId } });
      if (tray) {
        const remaining = Math.max(0, tray.paperRemaining - printedPages);
        await prisma.tray.update({
          where: { id: tray.id },
          data: {
            paperRemaining: remaining,
            status: remaining === 0 ? 'OUT_OF_PAPER' : tray.status,
          },
        });
      }
    } catch (err) {
      logger.error('Failed to deduct paper remaining:', err);
    }
  }

  // Delete temp file for security & disk cleanup
  if (job.tempFilePath && fs.existsSync(job.tempFilePath)) {
    try {
      fs.unlinkSync(job.tempFilePath);
      logger.info(`Safely removed temporary file: ${job.tempFilePath}`);
    } catch (err) {
      logger.error('Failed to delete temporary file:', err);
    }
  }

  try {
    const io = getIO();
    io.to(`job:${jobId}`).emit('job:status_changed', {
      jobId,
      orderCode: job.orderCode,
      status: 'COMPLETED',
      printedPages,
      message: 'พิมพ์เอกสารเสร็จสมบูรณ์เรียบร้อยแล้ว กรุณารับเอกสารที่ช่องรับ',
    });
    io.to('kiosk:admin').emit('admin:order_updated', { jobId, orderCode: job.orderCode, status: 'COMPLETED' });
  } catch (err) {
    logger.error('Socket emit error on completeJob:', err);
  }
}

export async function failJob(jobId: string, errorCode: string, detail?: string) {
  logger.error(`Failing job ${jobId} with code ${errorCode}: ${detail}`);
  const job = await prisma.printJob.findUnique({ where: { id: jobId } });
  if (!job) return;

  await prisma.printJob.update({
    where: { id: jobId },
    data: {
      status: 'FAILED',
      failureReason: detail || errorCode,
    },
  });

  if (errorCode === 'OUT_OF_PAPER' && job.targetTrayId) {
    await prisma.tray.update({
      where: { id: job.targetTrayId },
      data: { status: 'OUT_OF_PAPER' },
    });
  }

  // Delete temp file
  if (job.tempFilePath && fs.existsSync(job.tempFilePath)) {
    try {
      fs.unlinkSync(job.tempFilePath);
    } catch (err) {
      logger.error('Failed to delete temp file on failure:', err);
    }
  }

  try {
    const io = getIO();
    io.to(`job:${jobId}`).emit('job:status_changed', {
      jobId,
      orderCode: job.orderCode,
      status: 'FAILED',
      error: errorCode,
      message: detail || 'การพิมพ์ขัดข้อง กรุณาติดต่อผู้ดูแลระบบ',
    });
    io.to('kiosk:admin').emit('admin:order_updated', { jobId, orderCode: job.orderCode, status: 'FAILED' });
  } catch (err) {
    logger.error('Socket emit error on failJob:', err);
  }
}
