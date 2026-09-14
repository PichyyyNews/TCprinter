import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import { logger } from '../lib/logger';

const execAsync = promisify(exec);

export interface DiscoveredPrinter {
  name: string;
  driverName: string;
  portName: string;
  connectionType: 'USB' | 'LAN' | 'VIRTUAL' | 'LOCAL';
  isOnline: boolean;
  rawStatus?: number;
}

export async function discoverWindowsPrinters(): Promise<DiscoveredPrinter[]> {
  if (os.platform() !== 'win32') {
    logger.warn('Printer discovery via PowerShell is only supported on Windows');
    return [];
  }

  const psCommand = 'powershell.exe -NoProfile -NonInteractive -Command "Get-Printer | Select-Object Name, DriverName, PortName, PrinterStatus, Type | ConvertTo-Json -Compress"';

  try {
    const { stdout, stderr } = await execAsync(psCommand, { timeout: 10000 });
    if (stderr && stderr.trim().length > 0) {
      logger.warn(`PowerShell Get-Printer warning: ${stderr}`);
    }

    const trimmed = stdout.trim();
    if (!trimmed) {
      return [];
    }

    const parsed = JSON.parse(trimmed);
    const rawList = Array.isArray(parsed) ? parsed : [parsed];

    return rawList.map((p: any) => {
      const name = String(p.Name || '').trim();
      const driverName = String(p.DriverName || '').trim();
      const portName = String(p.PortName || '').trim();
      const rawStatus = typeof p.PrinterStatus === 'number' ? p.PrinterStatus : 0;

      // Infer connection type
      let connectionType: 'USB' | 'LAN' | 'VIRTUAL' | 'LOCAL' = 'LOCAL';
      const upperPort = portName.toUpperCase();
      const upperName = name.toUpperCase();
      const upperDriver = driverName.toUpperCase();

      if (
        upperName.includes('PDF') ||
        upperName.includes('XPS') ||
        upperName.includes('ONENOTE') ||
        upperName.includes('FAX') ||
        upperDriver.includes('PDF')
      ) {
        connectionType = 'VIRTUAL';
      } else if (upperPort.startsWith('USB')) {
        connectionType = 'USB';
      } else if (
        upperPort.startsWith('IP_') ||
        upperPort.startsWith('TCP') ||
        upperPort.startsWith('WSD') ||
        upperPort.includes('192.168.') ||
        upperPort.includes('10.') ||
        upperPort.includes('172.')
      ) {
        connectionType = 'LAN';
      }

      // Windows PrinterStatus: 0 is Normal/Ready, 3 is Idle
      const isOnline = rawStatus === 0 || rawStatus === 3;

      return {
        name,
        driverName,
        portName,
        connectionType,
        isOnline,
        rawStatus,
      };
    });
  } catch (err: any) {
    logger.error('Failed to discover Windows printers via PowerShell:', err);
    return [];
  }
}
