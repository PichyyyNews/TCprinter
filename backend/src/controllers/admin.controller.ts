import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { env } from '../config/env.config';
import { logger } from '../lib/logger';
import { getIO } from '../sockets';
import {
  createPrinterSchema,
  updatePrinterSchema,
  createTraySchema,
  updateTraySchema,
  createPricingSchema,
  updatePricingSchema,
  createConfigSchema,
  updateConfigSchema,
  testNotificationSchema,
  testPrintSchema,
  agentModeSchema,
} from '../schemas/admin.schema';
import { discoverWindowsPrinters } from '../services/printer-discovery.service';
import { processBankWebhook } from '../services/webhook.service';
import { dispatchJobToAgent, notifyPaymentConfirmed } from '../services/queue.service';
import { getAgentRuntimeStatus, setRuntimeDriverMode, pushConfigToAgent } from '../sockets/agent.handler';

// ==================== PRINTERS CRUD & DISCOVERY ====================

export async function handleGetPrinters(_req: Request, res: Response, next: NextFunction) {
  try {
    const printers = await prisma.printer.findMany({
      include: {
        trays: {
          orderBy: { trayNumber: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: printers });
  } catch (err) {
    next(err);
  }
}

export async function handleCreatePrinter(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = createPrinterSchema.parse(req.body);
    const printer = await prisma.printer.create({
      data: validated,
      include: { trays: true },
    });
    res.status(201).json({ success: true, data: printer });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdatePrinter(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const validated = updatePrinterSchema.parse(req.body);
    const updated = await prisma.printer.update({
      where: { id },
      data: validated,
      include: { trays: true },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function handleDeletePrinter(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const trays = await prisma.tray.findMany({
      where: { printerId: id },
      select: { id: true },
    });
    const trayIds = trays.map((t) => t.id);

    if (trayIds.length > 0) {
      await prisma.printJob.updateMany({
        where: { targetTrayId: { in: trayIds } },
        data: { targetTrayId: null },
      });
      await prisma.tray.deleteMany({
        where: { printerId: id },
      });
    }

    await prisma.printer.delete({
      where: { id },
    });
    res.json({ success: true, message: 'Printer deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function handleDiscoverPrinters(_req: Request, res: Response, next: NextFunction) {
  try {
    const discovered = await discoverWindowsPrinters();
    res.json({ success: true, data: discovered });
  } catch (err) {
    next(err);
  }
}

// ==================== TRAYS CRUD ====================

export async function handleGetTrays(_req: Request, res: Response, next: NextFunction) {
  try {
    const trays = await prisma.tray.findMany({
      orderBy: [{ printerId: 'asc' }, { trayNumber: 'asc' }],
      include: { printer: true },
    });
    res.json({ success: true, data: trays });
  } catch (err) {
    next(err);
  }
}

export async function handleCreateTray(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = createTraySchema.parse(req.body);
    const tray = await prisma.tray.create({
      data: validated,
      include: { printer: true },
    });
    res.status(201).json({ success: true, data: tray });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateTray(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const validated = updateTraySchema.parse(req.body);

    // Auto-recover status if refilled with paper
    const currentTray = await prisma.tray.findUnique({ where: { id } });
    if (
      currentTray?.status === 'OUT_OF_PAPER' &&
      validated.paperRemaining !== undefined &&
      validated.paperRemaining > 0 &&
      !validated.status
    ) {
      validated.status = 'OK';
    }

    const updated = await prisma.tray.update({
      where: { id },
      data: validated,
      include: { printer: true },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function handleDeleteTray(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await prisma.printJob.updateMany({
      where: { targetTrayId: id },
      data: { targetTrayId: null },
    });
    await prisma.tray.delete({
      where: { id },
    });
    res.json({ success: true, message: 'Tray deleted successfully' });
  } catch (err) {
    next(err);
  }
}

// ==================== PRICING RULES CRUD ====================

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

export async function handleCreatePricingRule(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = createPricingSchema.parse(req.body);
    const rule = await prisma.pricingRule.create({
      data: validated,
    });
    res.status(201).json({ success: true, data: rule });
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

export async function handleDeletePricingRule(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await prisma.pricingRule.delete({
      where: { id },
    });
    res.json({ success: true, message: 'Pricing rule deleted successfully' });
  } catch (err) {
    next(err);
  }
}

// ==================== JOBS AUDIT & CONTROLS ====================

export async function handleGetJobs(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, search, limit = '50', page = '1' } = req.query;
    const take = parseInt(limit as string, 10);
    const skip = (parseInt(page as string, 10) - 1) * take;

    const where: any = {};
    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status;
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { orderCode: { contains: q } },
        { originalFileName: { contains: q } },
      ];
    }

    const [jobs, total] = await Promise.all([
      prisma.printJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: {
          targetTray: {
            include: { printer: true },
          },
          paymentLogs: true,
        },
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
        totalPages: Math.ceil(total / take) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function handleRetryJob(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const job = await prisma.printJob.findUnique({
      where: { id },
      include: { targetTray: true },
    });

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    // Set job status to PAID and dispatch
    const updated = await prisma.printJob.update({
      where: { id },
      data: {
        status: 'PAID',
        failureReason: null,
      },
      include: { targetTray: true },
    });

    await dispatchJobToAgent(updated);

    res.json({
      success: true,
      message: `Job ${job.orderCode} has been re-dispatched to print agent`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleCancelJob(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const job = await prisma.printJob.findUnique({ where: { id } });

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const updated = await prisma.printJob.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        failureReason: 'Cancelled by admin operator',
      },
    });

    try {
      const io = getIO();
      io.to(`job:${id}`).emit('job:status_changed', {
        jobId: id,
        orderCode: job.orderCode,
        status: 'CANCELLED',
        message: 'งานพิมพ์ถูกยกเลิกโดยผู้ดูแลระบบ',
      });
      io.to('kiosk:admin').emit('admin:order_updated', {
        jobId: id,
        orderCode: job.orderCode,
        status: 'CANCELLED',
      });
    } catch {
      // socket may not be initialized in test
    }

    res.json({ success: true, message: `Job ${job.orderCode} cancelled`, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function handleApprovePayment(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const job = await prisma.printJob.findUnique({
      where: { id },
      include: { targetTray: true },
    });

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const now = new Date();

    const updatedJob = await prisma.printJob.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: now,
      },
      include: { targetTray: true },
    });

    // Create payment log record
    await prisma.paymentLog.create({
      data: {
        jobId: job.id,
        method: 'MANUAL_ADMIN',
        bankName: 'CASH_OR_ADMIN_OVERRIDE',
        amountReceived: job.totalAmount,
        rawPayload: JSON.stringify({ approvedBy: 'ADMIN_PANEL', timestamp: now.toISOString() }),
        isMatched: true,
      },
    });

    notifyPaymentConfirmed(job.id, job.orderCode, 'Payment approved manually by admin');
    await dispatchJobToAgent(updatedJob);

    res.json({
      success: true,
      message: `Payment for job ${job.orderCode} approved successfully`,
      data: updatedJob,
    });
  } catch (err) {
    next(err);
  }
}

// ==================== PAYMENTS & NOTIFICATIONS ====================

export async function handleGetPayments(req: Request, res: Response, next: NextFunction) {
  try {
    const { method, isMatched, limit = '50', page = '1' } = req.query;
    const take = parseInt(limit as string, 10);
    const skip = (parseInt(page as string, 10) - 1) * take;

    const where: any = {};
    if (method && typeof method === 'string' && method !== 'ALL') {
      where.method = method;
    }
    if (isMatched !== undefined && isMatched !== 'ALL') {
      where.isMatched = isMatched === 'true';
    }

    const [logs, total] = await Promise.all([
      prisma.paymentLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: {
          job: {
            select: {
              id: true,
              orderCode: true,
              originalFileName: true,
              status: true,
              totalAmount: true,
            },
          },
        },
      }),
      prisma.paymentLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page as string, 10),
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function handleGetNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const { limit = '50', page = '1' } = req.query;
    const take = parseInt(limit as string, 10);
    const skip = (parseInt(page as string, 10) - 1) * take;

    const where = { method: 'NOTIFICATION_WEBHOOK' };

    const [logs, total] = await Promise.all([
      prisma.paymentLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: {
          job: {
            select: {
              id: true,
              orderCode: true,
              status: true,
              totalAmount: true,
            },
          },
        },
      }),
      prisma.paymentLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: logs,
      webhookConfig: {
        endpointUrl: '/api/v1/payments/webhook',
        webhookSecret: env.WEBHOOK_SECRET,
        toleranceMinutes: env.WEBHOOK_TOLERANCE_MINUTES,
      },
      pagination: {
        total,
        page: parseInt(page as string, 10),
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function handleTestNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = testNotificationSchema.parse(req.body);
    const result = await processBankWebhook({
      amount: validated.amount,
      bank: validated.bank,
      rawText: validated.rawText || `Simulated bank transfer of ${validated.amount} THB via admin test`,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: result.matched
        ? `Matched payment for order ${result.orderCode}`
        : `Simulated webhook received: No pending order matched ${validated.amount} THB`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

// ==================== PRINT AGENT CONTROLS ====================

export async function handleGetAgentStatus(_req: Request, res: Response, next: NextFunction) {
  try {
    const runtimeStatus = getAgentRuntimeStatus();

    // Check system config for driver mode
    const modeConfig = await prisma.systemConfig.findUnique({
      where: { key: 'agent_driver_mode' },
    });

    if (modeConfig?.value) {
      runtimeStatus.driverMode = modeConfig.value;
    }

    res.json({
      success: true,
      data: {
        ...runtimeStatus,
        agentTokenConfigured: !!env.AGENT_TOKEN,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function handleSetAgentMode(req: Request, res: Response, next: NextFunction) {
  try {
    const { mode } = agentModeSchema.parse(req.body);

    setRuntimeDriverMode(mode);

    await prisma.systemConfig.upsert({
      where: { key: 'agent_driver_mode' },
      update: { value: mode, description: 'Active print driver mode: SIMULATION or SUMATRA' },
      create: { key: 'agent_driver_mode', value: mode, description: 'Active print driver mode: SIMULATION or SUMATRA' },
    });

    try {
      const io = getIO();
      io.to('kiosk:agent').emit('agent:set_mode', { mode });
      io.to('kiosk:admin').emit('admin:agent_status', getAgentRuntimeStatus());
    } catch {
      // socket may not be initialized in test
    }

    res.json({
      success: true,
      message: `Driver mode updated to ${mode}`,
      data: { mode },
    });
  } catch (err) {
    next(err);
  }
}

export async function handleTriggerTestPrint(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = testPrintSchema.parse(req.body);

    const printer = validated.printerName
      ? await prisma.printer.findUnique({ where: { name: validated.printerName } })
      : await prisma.printer.findFirst({ where: { status: 'ONLINE' } });

    const targetPrinterName = printer?.name || 'TC-Main-Printer';

    try {
      const io = getIO();
      io.to('kiosk:agent').emit('agent:test_print', {
        printerName: targetPrinterName,
        paperSize: validated.paperSize,
        isColor: validated.isColor,
        trayNumber: validated.trayNumber || 1,
        copies: 1,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // socket error handled
    }

    res.json({
      success: true,
      message: `Test print dispatched to agent for printer: ${targetPrinterName}`,
      data: {
        printerName: targetPrinterName,
        paperSize: validated.paperSize,
        isColor: validated.isColor,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ==================== SYSTEM CONFIG & ENV ====================

export async function handleGetConfigs(_req: Request, res: Response, next: NextFunction) {
  try {
    const configs = await prisma.systemConfig.findMany({
      orderBy: { key: 'asc' },
    });

    // Provide safe read-only environment view
    const envSummary = {
      PORT: env.PORT,
      NODE_ENV: env.NODE_ENV,
      CORS_ORIGIN: env.CORS_ORIGIN,
      PROMPTPAY_TARGET: env.PROMPTPAY_TARGET,
      WEBHOOK_TOLERANCE_MINUTES: env.WEBHOOK_TOLERANCE_MINUTES,
      ORDER_TIMEOUT_SECONDS: 900,
      WEBHOOK_SECRET_MASKED: env.WEBHOOK_SECRET ? `${env.WEBHOOK_SECRET.substring(0, 4)}••••••••` : 'Not set',
      AGENT_TOKEN_MASKED: env.AGENT_TOKEN ? `${env.AGENT_TOKEN.substring(0, 4)}••••••••` : 'Not set',
    };

    res.json({
      success: true,
      data: configs,
      environment: envSummary,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleUpsertConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = createConfigSchema.parse(req.body);
    const config = await prisma.systemConfig.upsert({
      where: { key: validated.key },
      update: {
        value: validated.value,
        description: validated.description,
      },
      create: validated,
    });

    // Push relevant config to print agent in real-time (non-fatal if agent is offline)
    if (['agent_printer_name', 'agent_sumatra_path'].includes(validated.key)) {
      try {
        const io = getIO();
        const agentConfigs = await prisma.systemConfig.findMany({
          where: { key: { in: ['agent_printer_name', 'agent_sumatra_path'] } },
        });
        const configMap: Record<string, string> = {};
        agentConfigs.forEach((c) => { configMap[c.key] = c.value; });
        pushConfigToAgent(io, {
          printerName: configMap['agent_printer_name'],
          sumatraPath: configMap['agent_sumatra_path'],
        });
      } catch {
        // Agent may be offline — non-fatal
      }
    }

    res.json({ success: true, data: config });
  } catch (err) {
    next(err);
  }
}

export async function handleDeleteConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const { key } = req.params;
    await prisma.systemConfig.delete({
      where: { key },
    });
    res.json({ success: true, message: `Configuration '${key}' deleted successfully` });
  } catch (err) {
    next(err);
  }
}

// ==================== TELEMETRY & STATS ====================

export async function handleGetStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const [completedJobs, activeQueuedJobs, printers, trays] = await Promise.all([
      prisma.printJob.findMany({
        where: { status: 'COMPLETED' },
        select: { totalAmount: true, pageCount: true, copies: true, isDuplex: true },
      }),
      prisma.printJob.count({
        where: { status: { in: ['PAID', 'DISPATCHED', 'PRINTING'] } },
      }),
      prisma.printer.findMany({
        select: { id: true, name: true, status: true, totalSheetsPrinted: true },
      }),
      prisma.tray.findMany({
        select: { id: true, paperRemaining: true, isActive: true, status: true },
      }),
    ]);

    const totalRevenue = completedJobs.reduce((sum, j) => sum + j.totalAmount, 0);
    const totalPagesPrinted = completedJobs.reduce((sum, j) => sum + j.pageCount * j.copies, 0);
    const totalSheetsConsumed = completedJobs.reduce(
      (sum, j) => sum + (j.isDuplex ? Math.ceil(j.pageCount / 2) : j.pageCount) * j.copies,
      0
    );

    const totalPaperInTrays = trays.reduce((sum, t) => sum + t.paperRemaining, 0);
    const onlinePrintersCount = printers.filter((p) => p.status === 'ONLINE').length;
    const totalSheetsPrintedOnPrinters = printers.reduce((sum, p) => sum + (p.totalSheetsPrinted || 0), 0);

    res.json({
      success: true,
      data: {
        totalJobsCompleted: completedJobs.length,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalPagesPrinted,
        totalSheetsConsumed,
        totalSheetsPrintedOnPrinters,
        activeQueuedJobs,
        totalPrinters: printers.length,
        onlinePrinters: onlinePrintersCount,
        totalPaperRemaining: totalPaperInTrays,
        agentStatus: getAgentRuntimeStatus(),
      },
    });
  } catch (err) {
    next(err);
  }
}
