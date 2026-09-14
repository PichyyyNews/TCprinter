import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { IPrinterDriver } from '../drivers/base.driver';
import { FileDownloaderService } from './downloader.service';
import { agentConfig } from '../config/agent.config';

export interface NewJobPayload {
  jobId: string;
  orderCode: string;
  downloadToken: string;
  printSettings: {
    printerName?: string;
    paperSize: string;
    isColor: boolean;
    isDuplex: boolean;
    duplexEdge: 'NONE' | 'LONG_EDGE' | 'SHORT_EDGE';
    trayNumber: number;
    copies: number;
    pageRange: string;
  };
}

export class JobExecutorService {
  constructor(
    private driver: IPrinterDriver,
    private downloader: FileDownloaderService
  ) {}

  setDriver(driver: IPrinterDriver) {
    this.driver = driver;
    console.log(`[Executor] Active printer driver set to: ${driver.name}`);
  }

  getDriverName(): string {
    return this.driver.name;
  }

  async executeTestPrint(payload: {
    printerName?: string;
    paperSize?: string;
    isColor?: boolean;
    trayNumber?: number;
  }): Promise<boolean> {
    console.log(`[Executor] Executing test print on printer: ${payload.printerName || agentConfig.PRINTER_NAME}`);
    if (!fs.existsSync(agentConfig.TEMP_DIR)) {
      fs.mkdirSync(agentConfig.TEMP_DIR, { recursive: true });
    }

    const testFilePath = path.join(agentConfig.TEMP_DIR, `test_page_${Date.now()}.pdf`);

    const minimalPdf = `%PDF-1.1
%¥±ë
1 0 obj
  << /Type /Catalog
     /Pages 2 0 R
  >>
endobj
2 0 obj
  << /Type /Pages
     /Kids [3 0 R]
     /Count 1
     /MediaBox [0 0 300 144]
  >>
endobj
3 0 obj
  <<  /Type /Page
      /Parent 2 0 R
      /Resources
       << /Font
           << /F1
               << /Type /Font
                  /Subtype /Type1
                  /BaseFont /Helvetica
               >>
           >>
       >>
      /Contents 4 0 R
  >>
endobj
4 0 obj
  << /Length 55 >>
stream
  BT
    /F1 18 Tf
    50 70 Td
    (TCprinter Hardware Test Page) Tj
  ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000015 00000 n 
0000000068 00000 n 
0000000157 00000 n 
0000000304 00000 n 
trailer
  << /Root 1 0 R
     /Size 5
  >>
startxref
408
%%EOF`;

    try {
      fs.writeFileSync(testFilePath, minimalPdf);

      const result = await this.driver.print({
        filePath: testFilePath,
        printerName: payload.printerName || agentConfig.PRINTER_NAME,
        paperSize: payload.paperSize || 'A4',
        isColor: payload.isColor || false,
        isDuplex: false,
        duplexEdge: 'NONE',
        trayNumber: payload.trayNumber || 1,
        copies: 1,
        pageRange: '1',
      });

      console.log(`[Executor] Test print completed with status: ${result.success}`);
      return result.success;
    } catch (err) {
      console.error('[Executor] Test print error:', err);
      return false;
    } finally {
      if (fs.existsSync(testFilePath)) {
        try {
          fs.unlinkSync(testFilePath);
        } catch {}
      }
    }
  }

  async executeJob(job: NewJobPayload): Promise<void> {
    console.log(`[Executor] Starting execution for job ${job.jobId} (${job.orderCode}) using ${this.driver.name}`);
    let downloadedFilePath = '';

    try {
      // 1. Download file
      downloadedFilePath = await this.downloader.downloadJobPdf(job.jobId, job.downloadToken);

      // 2. Dispatch to driver
      const targetPrinter = job.printSettings.printerName || agentConfig.PRINTER_NAME;
      const result = await this.driver.print({
        filePath: downloadedFilePath,
        printerName: targetPrinter,
        paperSize: job.printSettings.paperSize,
        isColor: job.printSettings.isColor,
        isDuplex: job.printSettings.isDuplex,
        duplexEdge: job.printSettings.duplexEdge,
        trayNumber: job.printSettings.trayNumber,
        copies: job.printSettings.copies,
        pageRange: job.printSettings.pageRange,
      });

      if (result.success) {
        // 3. Report completion
        await axios.post(
          `${agentConfig.BACKEND_URL}/api/v1/agent/jobs/${job.jobId}/complete`,
          {
            status: 'COMPLETED',
            printedPages: result.printedPages || 1,
            executionDurationMs: result.executionDurationMs || 0,
          },
          {
            headers: { 'X-Agent-Token': agentConfig.AGENT_TOKEN },
          }
        );
        console.log(`[Executor] Job ${job.jobId} reported as COMPLETED.`);
      } else {
        // 4. Report error
        await axios.post(
          `${agentConfig.BACKEND_URL}/api/v1/agent/jobs/${job.jobId}/error`,
          {
            status: 'FAILED',
            errorCode: 'PRINT_DRIVER_ERROR',
            detail: result.errorMessage || 'Printing command failed',
          },
          {
            headers: { 'X-Agent-Token': agentConfig.AGENT_TOKEN },
          }
        );
        console.error(`[Executor] Job ${job.jobId} reported as FAILED: ${result.errorMessage}`);
      }
    } catch (err: any) {
      console.error(`[Executor] Unexpected execution failure for job ${job.jobId}:`, err);
      try {
        await axios.post(
          `${agentConfig.BACKEND_URL}/api/v1/agent/jobs/${job.jobId}/error`,
          {
            status: 'FAILED',
            errorCode: 'SYSTEM_EXECUTION_ERROR',
            detail: err.message,
          },
          {
            headers: { 'X-Agent-Token': agentConfig.AGENT_TOKEN },
          }
        );
      } catch (postErr) {
        console.error('[Executor] Failed to send error callback to server:', postErr);
      }
    } finally {
      // 5. Clean up downloaded file
      if (downloadedFilePath) {
        this.downloader.cleanupFile(downloadedFilePath);
      }
    }
  }
}
