import { Server, Socket } from 'socket.io';
import { logger } from '../lib/logger';
import prisma from '../lib/prisma';

export interface AgentRuntimeStatus {
  isConnected: boolean;
  socketCount: number;
  lastHeartbeat: string | null;
  printerStatus: string;
  driverMode: string;
  currentJobId: string | null;
}

const connectedAgentSockets = new Set<string>();
let lastAgentHeartbeat: string | null = null;
let lastPrinterStatus = 'OFFLINE';
let currentDriverMode = 'SIMULATION';

export function getAgentRuntimeStatus(): AgentRuntimeStatus {
  return {
    isConnected: connectedAgentSockets.size > 0,
    socketCount: connectedAgentSockets.size,
    lastHeartbeat: lastAgentHeartbeat,
    printerStatus: connectedAgentSockets.size > 0 ? lastPrinterStatus : 'OFFLINE',
    driverMode: currentDriverMode,
    currentJobId: null,
  };
}

export function setRuntimeDriverMode(mode: string) {
  currentDriverMode = mode;
}

export function pushConfigToAgent(io: Server, config: { printerName?: string; sumatraPath?: string }) {
  io.to('kiosk:agent').emit('agent:config_updated', config);
  logger.info(`[AgentHandler] Pushed config update to agent: ${JSON.stringify(config)}`);
}

export function setupAgentHandlers(io: Server, socket: Socket) {
  socket.on('join:agent', () => {
    socket.join('kiosk:agent');
    connectedAgentSockets.add(socket.id);
    lastPrinterStatus = 'ONLINE';
    lastAgentHeartbeat = new Date().toISOString();
    logger.info(`Print Agent socket ${socket.id} joined kiosk:agent (total: ${connectedAgentSockets.size})`);
    socket.emit('agent:connected', { success: true, timestamp: lastAgentHeartbeat });
    io.to('kiosk:admin').emit('admin:agent_status', getAgentRuntimeStatus());
  });

  socket.on('agent:heartbeat', async (data: { printerStatus?: string; timestamp?: string; driverMode?: string }) => {
    logger.debug(`Print Agent heartbeat from ${socket.id}: ${JSON.stringify(data)}`);
    lastAgentHeartbeat = data.timestamp || new Date().toISOString();
    lastPrinterStatus = data.printerStatus || 'ONLINE';
    if (data.driverMode) {
      currentDriverMode = data.driverMode;
    }

    try {
      await prisma.printer.updateMany({
        where: { name: 'TC-Main-Printer' },
        data: {
          status: lastPrinterStatus,
          lastSeen: new Date(),
        },
      });
      io.to('kiosk:admin').emit('admin:printer_status', {
        ...data,
        agentStatus: getAgentRuntimeStatus(),
      });
      io.to('kiosk:admin').emit('admin:agent_status', getAgentRuntimeStatus());
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

  socket.on('disconnect', () => {
    if (connectedAgentSockets.has(socket.id)) {
      connectedAgentSockets.delete(socket.id);
      logger.info(`Print Agent socket ${socket.id} disconnected (remaining: ${connectedAgentSockets.size})`);
      if (connectedAgentSockets.size === 0) {
        lastPrinterStatus = 'OFFLINE';
      }
      io.to('kiosk:admin').emit('admin:agent_status', getAgentRuntimeStatus());
    }
  });
}
