import cron from 'node-cron';
import fs from 'fs';
import prisma from '../lib/prisma';
import { logger } from '../lib/logger';
import { getIO } from '../sockets';

export function startTimeoutCron() {
  // Run every 30 seconds
  cron.schedule('*/30 * * * * *', async () => {
    try {
      const now = new Date();
      const expiredJobs = await prisma.printJob.findMany({
        where: {
          status: 'PENDING_PAYMENT',
          expiresAt: { lt: now },
        },
      });

      if (expiredJobs.length === 0) return;

      logger.info(`Found ${expiredJobs.length} expired payment jobs. Releasing satang allocations...`);

      for (const job of expiredJobs) {
        await prisma.printJob.update({
          where: { id: job.id },
          data: {
            status: 'EXPIRED',
            failureReason: 'Payment window expired (15 minutes timeout)',
          },
        });

        // Safely remove temp file
        if (job.tempFilePath && fs.existsSync(job.tempFilePath)) {
          try {
            fs.unlinkSync(job.tempFilePath);
          } catch (e) {
            logger.error(`Error deleting temp file for expired job ${job.id}:`, e);
          }
        }

        try {
          const io = getIO();
          io.to(`job:${job.id}`).emit('job:expired', {
            jobId: job.id,
            message: 'คำสั่งพิมพ์หมดอายุเนื่องจากเกินเวลา 15 นาที กรุณาทำรายการใหม่อีกครั้ง',
          });
        } catch {
          // Socket.io might not be active in tests
        }
      }
    } catch (err) {
      logger.error('Error executing timeout cron:', err);
    }
  });
}
