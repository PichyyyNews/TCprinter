// print-agent/src/types/driver.types.ts

export interface PrintCommandOptions {
  filePath: string;
  printerName: string;
  paperSize: string; // 'A4' | 'A3'
  isColor: boolean;
  isDuplex: boolean;
  duplexEdge?: 'LONG_EDGE' | 'SHORT_EDGE' | 'NONE';
  trayNumber?: number;
  copies: number;
  pageRange?: string; // 'all' or '1-5'
}

export interface PrintResult {
  success: boolean;
  jobId: string;
  printedPages?: number;
  errorMessage?: string;
  executionDurationMs?: number;
}

export interface IPrinterDriver {
  name: string;
  print(options: PrintCommandOptions): Promise<PrintResult>;
  isPrinterOnline(printerName: string): Promise<boolean>;
}
