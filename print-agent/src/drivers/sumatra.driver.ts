import { exec } from 'child_process';
import fs from 'fs';
import { IPrinterDriver, PrintCommandOptions, PrintResult } from './base.driver';
import { agentConfig } from '../config/agent.config';

export class SumatraPrinterDriver implements IPrinterDriver {
  name = 'SumatraPDF-Driver';

  async isPrinterOnline(_printerName: string): Promise<boolean> {
    // In Windows, Sumatra is an external CLI. Check if binary exists
    return fs.existsSync(agentConfig.SUMATRA_PATH);
  }

  async print(options: PrintCommandOptions): Promise<PrintResult> {
    const startTime = Date.now();
    const { filePath, printerName, paperSize, isColor, isDuplex, duplexEdge, trayNumber, copies, pageRange } = options;

    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        jobId: options.filePath,
        errorMessage: `PDF file not found at ${filePath}`,
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
    const cmd = `"${agentConfig.SUMATRA_PATH}" -print-to "${printerName}" -print-settings "${printSettingsArg}" "${filePath}"`;

    console.log(`[SumatraDriver] Executing: ${cmd}`);

    return new Promise((resolve) => {
      exec(cmd, (error, _stdout, stderr) => {
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
          console.log(`[SumatraDriver] Print command sent successfully.`);
          resolve({
            success: true,
            jobId: options.filePath,
            printedPages: 1,
            executionDurationMs,
          });
        }
      });
    });
  }
}
