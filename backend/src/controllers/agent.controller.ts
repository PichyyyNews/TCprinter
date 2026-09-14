import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import prisma from '../lib/prisma';
import { completeJob, failJob } from '../services/queue.service';

export async function handleDownloadJobPdf(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const job = await prisma.printJob.findUnique({ where: { id } });

    if (!job || !job.tempFilePath) {
      return res.status(404).json({ success: false, error: 'Job or PDF file not found' });
    }

    if (!fs.existsSync(job.tempFilePath)) {
      return res.status(410).json({ success: false, error: 'File has expired or was removed' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    const safeAscii = (job.originalFileName || 'document.pdf').replace(/[^\x20-\x7E]/g, '_');
    const encodedName = encodeURIComponent(job.originalFileName || 'document.pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeAscii}"; filename*=UTF-8''${encodedName}`);
    fs.createReadStream(job.tempFilePath).pipe(res);
  } catch (err) {
    next(err);
  }
}

export async function handleCompleteJob(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { printedPages = 1, executionDurationMs } = req.body;

    await completeJob(id, printedPages, executionDurationMs);
    res.json({ success: true, message: `Job ${id} completed successfully` });
  } catch (err) {
    next(err);
  }
}

export async function handleReportJobError(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { errorCode = 'PRINT_ERROR', detail } = req.body;

    await failJob(id, errorCode, detail);
    res.json({ success: true, message: `Job ${id} error recorded` });
  } catch (err) {
    next(err);
  }
}
