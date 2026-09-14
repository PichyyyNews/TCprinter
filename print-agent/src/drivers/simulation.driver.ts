import { IPrinterDriver, PrintCommandOptions, PrintResult } from './base.driver';

export class SimulationPrinterDriver implements IPrinterDriver {
  name = 'Simulation-Driver';

  async isPrinterOnline(_printerName: string): Promise<boolean> {
    return true;
  }

  async print(options: PrintCommandOptions): Promise<PrintResult> {
    console.log(`[SimDriver] Simulating print for file ${options.filePath} on printer "${options.printerName}"...`);
    console.log(`[SimDriver] Settings: Paper=${options.paperSize}, Color=${options.isColor}, Duplex=${options.isDuplex}, Tray=${options.trayNumber}, Copies=${options.copies}`);

    const startTime = Date.now();
    // Simulate printing duration (1.5 seconds)
    await new Promise((r) => setTimeout(r, 1500));

    console.log(`[SimDriver] Simulated print job finished successfully.`);
    return {
      success: true,
      jobId: options.filePath,
      printedPages: options.copies,
      executionDurationMs: Date.now() - startTime,
    };
  }
}
