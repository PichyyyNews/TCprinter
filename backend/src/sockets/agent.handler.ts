import { Server, Socket } from 'socket.io';
import { logger } from '../lib/logger';
import prisma from '../lib/prisma';

export function setupAgentHandlers(io: Server, socket: Socket) {
  socket.on('join:agent', () => {
    socket.join('kiosk:agent');
    logger.info(`Print Agent socket ${socket.id} joined kiosk:agent`);
    socket.emit('agent:connected', { success: true, timestamp: new Date().toISOString() });
  });

  socket.on('agent:heartbeat', async (data: { printerStatus: string; timestamp: string }) => {
    logger.debug(`Print Agent heartbeat from ${socket.id}: ${JSON.stringify(data)}`);
    try {
      await prisma.printer.updateMany({
        where: { name: 'TC-Main-Printer' },
        data: {
          status: data.printerStatus || 'ONLINE',
          lastSeen: new Date(),
        },
      });
      io.to('kiosk:admin').emit('admin:printer_status', data);
    } catch (err) {
      logger.error('Failed to record agent heartbeat:', err);
    }
  });

  socket.on('agent:job_progress', (data: { jobId: string; currentProgress: number; totalPages: number }) => {
    logger.info(`Print Agent progress for job ${data.jobId}: ${data.currentProgress}/${data.totalPages}`);
    io.to(`job:${data.jobId}`).emit('job:status_changed', {
      jobId: data.jobId,
      status: 'PRINTING',
      printedPages: data.currentProgress,
      message: `กำลังพิมพ์เอกสารหน้า ${data.currentProgress}/${data.totalPages}`,
    });
  });
}
