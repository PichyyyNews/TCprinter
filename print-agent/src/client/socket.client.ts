import { io, Socket } from 'socket.io-client';
import { agentConfig } from '../config/agent.config';
import { JobExecutorService, NewJobPayload } from '../services/executor.service';
import { PrinterMonitorService } from '../services/monitor.service';
import { SimulationPrinterDriver } from '../drivers/simulation.driver';
import { SumatraPrinterDriver } from '../drivers/sumatra.driver';

export class AgentSocketClient {
  private socket: Socket | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor(
    private executor: JobExecutorService,
    private monitor: PrinterMonitorService
  ) {}

  start(): void {
    console.log(`[AgentClient] Connecting to backend at ${agentConfig.BACKEND_URL}...`);
    this.socket = io(agentConfig.BACKEND_URL, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      console.log(`[AgentClient] Connected to backend! Socket ID: ${this.socket?.id}`);
      this.socket?.emit('join:agent');
      this.startHeartbeat();
    });

    this.socket.on('agent:connected', (data) => {
      console.log(`[AgentClient] Registered in kiosk:agent room at ${data.timestamp}`);
    });

    this.socket.on('agent:new_job', async (jobData: NewJobPayload) => {
      console.log(`[AgentClient] Received new print dispatch:`, jobData);
      await this.executor.executeJob(jobData);
    });

    this.socket.on('agent:test_print', async (payload) => {
      console.log(`[AgentClient] Received hardware test print request:`, payload);
      await this.executor.executeTestPrint(payload);
    });

    this.socket.on('agent:set_mode', (data: { mode: 'SIMULATION' | 'SUMATRA' }) => {
      console.log(`[AgentClient] Dynamically switching driver mode to: ${data.mode}`);
      const newDriver = data.mode === 'SUMATRA'
        ? new SumatraPrinterDriver()
        : new SimulationPrinterDriver();
      this.executor.setDriver(newDriver);
      this.monitor.setDriver(newDriver);
    });

    this.socket.on('agent:config_updated', (data: { printerName?: string; sumatraPath?: string }) => {
      console.log(`[AgentClient] Received live config update:`, data);
      if (data.printerName && data.printerName.trim()) {
        (agentConfig as any).PRINTER_NAME = data.printerName.trim();
        console.log(`[AgentClient] Printer name updated to: ${agentConfig.PRINTER_NAME}`);
      }
      if (data.sumatraPath && data.sumatraPath.trim()) {
        (agentConfig as any).SUMATRA_PATH = data.sumatraPath.trim();
        console.log(`[AgentClient] SumatraPDF path updated to: ${agentConfig.SUMATRA_PATH}`);
        // Re-init SumatraPrinterDriver with new path if currently in SUMATRA mode
        if (this.executor.getDriverName().includes('SumatraPDF')) {
          const updatedDriver = new SumatraPrinterDriver();
          this.executor.setDriver(updatedDriver);
          this.monitor.setDriver(updatedDriver);
        }
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.warn(`[AgentClient] Disconnected from backend: ${reason}`);
      this.stopHeartbeat();
    });

    this.socket.on('connect_error', (err) => {
      console.error(`[AgentClient] Connection error:`, err.message);
    });
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(async () => {
      const status = await this.monitor.checkHardwareStatus();
      this.socket?.emit('agent:heartbeat', {
        printerStatus: status,
        driverMode: this.executor.getDriverName(),
        timestamp: new Date().toISOString(),
      });
    }, 15000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  stop(): void {
    this.stopHeartbeat();
    this.socket?.disconnect();
    this.socket = null;
  }
}
