import { Server, Socket } from 'socket.io';
import { logger } from '../lib/logger';

export function setupUserHandlers(_io: Server, socket: Socket) {
  socket.on('join:job', (jobId: string) => {
    if (jobId) {
      const room = `job:${jobId}`;
      socket.join(room);
      logger.info(`Socket ${socket.id} joined room ${room}`);
      socket.emit('joined', { room, success: true });
    }
  });

  socket.on('leave:job', (jobId: string) => {
    if (jobId) {
      const room = `job:${jobId}`;
      socket.leave(room);
      logger.info(`Socket ${socket.id} left room ${room}`);
    }
  });
}
