import { IPrinterDriver } from '../drivers/base.driver';
import { agentConfig } from '../config/agent.config';

export class PrinterMonitorService {
  constructor(private driver: IPrinterDriver) {}

  setDriver(driver: IPrinterDriver) {
    this.driver = driver;
  }

  getDriverName(): string {
    return this.driver.name;
  }

  async checkHardwareStatus(): Promise<'ONLINE' | 'OFFLINE' | 'ERROR'> {
    try {
      const isOnline = await this.driver.isPrinterOnline(agentConfig.PRINTER_NAME);
      return isOnline ? 'ONLINE' : 'OFFLINE';
    } catch {
      return 'ERROR';
    }
  }
}
