import { Server, Socket } from 'socket.io';
import { logger } from '../lib/logger';

export function setupAdminHandlers(_io: Server, socket: Socket) {
  socket.on('join:admin', () => {
    socket.join('kiosk:admin');
    logger.info(`Socket ${socket.id} joined admin room kiosk:admin`);
    socket.emit('joined', { room: 'kiosk:admin', success: true });
  });
}
