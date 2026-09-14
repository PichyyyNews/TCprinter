import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { parsePdfFile } from '../services/pdf.service';
import { getPricingMatrix } from '../services/pricing.service';
import { storeQuote, createPrintJob } from '../services/queue.service';
import { createJobSchema } from '../schemas/job.schema';

export async function handleGetQuote(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No PDF file uploaded' });
    }

    const filePath = req.file.path;
    const metadata = await parsePdfFile(filePath);

    const quoteId = crypto.randomUUID();

    storeQuote({
      quoteId,
      fileName: req.file.originalname,
      tempFilePath: filePath,
      fileSizeBytes: req.file.size,
      pageCount: metadata.pageCount,
      createdAt: Date.now(),
    });

    const trays = await prisma.tray.findMany({
      where: { isActive: true },
      select: {
        id: true,
        trayNumber: true,
        paperSize: true,
        colorCapability: true,
        isActive: true,
      },
    });

    const pricingMatrix = await getPricingMatrix();

    res.json({
      success: true,
      data: {
        quoteId,
        fileName: req.file.originalname,
        fileSizeBytes: req.file.size,
        pageCount: metadata.pageCount,
        availableTrays: trays,
        pricingMatrix,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function handleCreateJob(req: Request, res: Response, next: NextFunction) {
  try {
    const validatedInput = createJobSchema.parse(req.body);
    const result = await createPrintJob(validatedInput);
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleGetJobStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const job = await prisma.printJob.findUnique({
      where: { id },
      include: {
        targetTray: true,
        paymentLogs: { select: { method: true, amountReceived: true, createdAt: true } },
      },
    });

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    res.json({
      success: true,
      data: {
        jobId: job.id,
        orderCode: job.orderCode,
        status: job.status,
        pageCount: job.pageCount,
        copies: job.copies,
        paperSize: job.paperSize,
        isColor: job.isColor,
        isDuplex: job.isDuplex,
        totalAmount: job.totalAmount,
        expiresAt: job.expiresAt,
        paidAt: job.paidAt,
        completedAt: job.completedAt,
        failureReason: job.failureReason,
        payments: job.paymentLogs,
      },
    });
  } catch (err) {
    next(err);
  }
}
