import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { updateTraySchema, updatePricingSchema } from '../schemas/admin.schema';

export async function handleGetTrays(_req: Request, res: Response, next: NextFunction) {
  try {
    const trays = await prisma.tray.findMany({
      orderBy: { trayNumber: 'asc' },
      include: { printer: true },
    });
    res.json({ success: true, data: trays });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateTray(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const validated = updateTraySchema.parse(req.body);
    const updated = await prisma.tray.update({
      where: { id },
      data: validated,
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function handleGetJobs(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, limit = '50', page = '1' } = req.query;
    const take = parseInt(limit as string, 10);
    const skip = (parseInt(page as string, 10) - 1) * take;

    const where: Record<string, unknown> = {};
    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status;
    }

    const [jobs, total] = await Promise.all([
      prisma.printJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: { targetTray: true },
      }),
      prisma.printJob.count({ where }),
    ]);

    res.json({
      success: true,
      data: jobs,
      pagination: {
        total,
        page: parseInt(page as string, 10),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function handleGetPricingRules(_req: Request, res: Response, next: NextFunction) {
  try {
    const rules = await prisma.pricingRule.findMany({
      orderBy: [{ paperSize: 'asc' }, { isColor: 'asc' }, { isDuplex: 'asc' }],
    });
    res.json({ success: true, data: rules });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdatePricingRule(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const validated = updatePricingSchema.parse(req.body);
    const updated = await prisma.pricingRule.update({
      where: { id },
      data: validated,
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function handleGetStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const completedJobs = await prisma.printJob.findMany({
      where: { status: 'COMPLETED' },
      select: { totalAmount: true, pageCount: true, copies: true },
    });

    const totalRevenue = completedJobs.reduce((sum, j) => sum + j.totalAmount, 0);
    const totalPagesPrinted = completedJobs.reduce((sum, j) => sum + j.pageCount * j.copies, 0);

    const activeQueuedJobs = await prisma.printJob.count({
      where: { status: { in: ['PAID', 'DISPATCHED', 'PRINTING'] } },
    });

    res.json({
      success: true,
      data: {
        totalJobsCompleted: completedJobs.length,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalPagesPrinted,
        activeQueuedJobs,
      },
    });
  } catch (err) {
    next(err);
  }
}
