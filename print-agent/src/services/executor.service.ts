import axios from 'axios';
import { IPrinterDriver } from '../drivers/base.driver';
import { FileDownloaderService } from './downloader.service';
import { agentConfig } from '../config/agent.config';

export interface NewJobPayload {
  jobId: string;
  orderCode: string;
  downloadToken: string;
  printSettings: {
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

  async executeJob(job: NewJobPayload): Promise<void> {
    console.log(`[Executor] Starting execution for job ${job.jobId} (${job.orderCode})`);
    let downloadedFilePath = '';

    try {
      // 1. Download file
      downloadedFilePath = await this.downloader.downloadJobPdf(job.jobId, job.downloadToken);

      // 2. Dispatch to driver
      const result = await this.driver.print({
        filePath: downloadedFilePath,
        printerName: agentConfig.PRINTER_NAME,
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
