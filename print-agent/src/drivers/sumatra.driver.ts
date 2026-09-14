import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { IPrinterDriver, PrintCommandOptions, PrintResult } from './base.driver';
import { agentConfig } from '../config/agent.config';

const execAsync = promisify(exec);

/**
 * Searches standard system paths for SumatraPDF.exe executable
 */
export function locateSumatraExecutable(): string | null {
  const candidatePaths: string[] = [];

  // 1. Explicitly configured path from environment or config
  if (process.env.SUMATRA_PATH && fs.existsSync(process.env.SUMATRA_PATH)) {
    return process.env.SUMATRA_PATH;
  }
  if (agentConfig.SUMATRA_PATH && fs.existsSync(agentConfig.SUMATRA_PATH)) {
    return agentConfig.SUMATRA_PATH;
  }

  // 2. Standard Program Files locations
  candidatePaths.push('C:\\Program Files\\SumatraPDF\\SumatraPDF.exe');
  candidatePaths.push('C:\\Program Files (x86)\\SumatraPDF\\SumatraPDF.exe');

  // 3. User LocalAppData & AppData
  if (process.env.LOCALAPPDATA) {
    candidatePaths.push(path.join(process.env.LOCALAPPDATA, 'SumatraPDF', 'SumatraPDF.exe'));
  }
  if (process.env.APPDATA) {
    candidatePaths.push(path.join(process.env.APPDATA, 'SumatraPDF', 'SumatraPDF.exe'));
  }

  // 4. Project relative bin folders
  candidatePaths.push(path.resolve(__dirname, '../../bin/SumatraPDF.exe'));
  candidatePaths.push(path.resolve(process.cwd(), 'bin/SumatraPDF.exe'));
  candidatePaths.push(path.resolve(process.cwd(), 'SumatraPDF.exe'));

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

export class SumatraPrinterDriver implements IPrinterDriver {
  name = 'SumatraPDF-Driver';
  private executablePath: string | null = null;

  constructor() {
    this.executablePath = locateSumatraExecutable();
    if (this.executablePath) {
      console.log(`[SumatraDriver] Discovered executable at: ${this.executablePath}`);
    } else {
      console.warn(`[SumatraDriver] SumatraPDF executable not found in standard paths. Install SumatraPDF or place it in ./bin/SumatraPDF.exe`);
    }
  }

  async isPrinterOnline(printerName: string): Promise<boolean> {
    // If not on Windows, or Sumatra not found, report false
    if (os.platform() !== 'win32' || !this.executablePath) {
      return false;
    }

    try {
      // Query Windows printer status via PowerShell with sanitized name
      const sanitizedName = printerName.replace(/'/g, "''");
      const cmd = `powershell.exe -NoProfile -NonInteractive -Command "Get-Printer -Name '${sanitizedName}' -ErrorAction Stop | Select-Object -ExpandProperty PrinterStatus"`;
      const { stdout } = await execAsync(cmd, { timeout: 4000 });
      const statusNum = parseInt(stdout.trim(), 10);
      return statusNum === 0 || statusNum === 3;
    } catch {
      // If printer query fails, check if the executable itself is ready
      return fs.existsSync(this.executablePath);
    }
  }

  async print(options: PrintCommandOptions): Promise<PrintResult> {
    const startTime = Date.now();
    const { filePath, printerName, paperSize, isColor, isDuplex, duplexEdge, trayNumber, copies, pageRange } = options;

    if (!this.executablePath || !fs.existsSync(this.executablePath)) {
      this.executablePath = locateSumatraExecutable();
      if (!this.executablePath) {
        return {
          success: false,
          jobId: filePath,
          errorMessage: 'SumatraPDF executable not found. Please install SumatraPDF or switch driver mode to Simulation in admin panel.',
          executionDurationMs: Date.now() - startTime,
        };
      }
    }

    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        jobId: filePath,
        errorMessage: `PDF file not found at ${filePath}`,
        executionDurationMs: Date.now() - startTime,
      };
    }

    // Build print settings string
    // e.g. "1x,color,duplex,paper=A4,bin=Tray1"
    const settings: string[] = [];
    settings.push(`${copies || 1}x`);
    settings.push(isColor ? 'color' : 'monochrome');

    if (isDuplex) {
      if (duplexEdge === 'SHORT_EDGE') {
        settings.push('duplexshort');
      } else {
        settings.push('duplex');
      }
    } else {
      settings.push('simplex');
    }

    if (paperSize) {
      settings.push(`paper=${paperSize}`);
    }

    if (trayNumber) {
      settings.push(`bin=Tray${trayNumber}`);
    }

    if (pageRange && pageRange !== 'all') {
      settings.push(`pages=${pageRange}`);
    }

    const printSettingsArg = settings.join(',');
    const sanitizedPrinterName = printerName.replace(/"/g, '\\"');
    const sanitizedFilePath = filePath.replace(/"/g, '\\"');
    const cmd = `"${this.executablePath}" -print-to "${sanitizedPrinterName}" -print-settings "${printSettingsArg}" "${sanitizedFilePath}"`;

    console.log(`[SumatraDriver] Executing: ${cmd}`);

    return new Promise((resolve) => {
      exec(cmd, { timeout: 30000 }, (error, _stdout, stderr) => {
        const executionDurationMs = Date.now() - startTime;
        if (error) {
          console.error(`[SumatraDriver] Error executing print:`, error, stderr);
          resolve({
            success: false,
            jobId: options.filePath,
            errorMessage: error.message || stderr,
            executionDurationMs,
          });
        } else {
          console.log(`[SumatraDriver] Print command dispatched successfully.`);
          resolve({
            success: true,
            jobId: options.filePath,
            printedPages: copies || 1,
            executionDurationMs,
          });
        }
      });
    });
  }
}
