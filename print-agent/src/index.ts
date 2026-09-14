import { agentConfig } from './config/agent.config';
import { SumatraPrinterDriver } from './drivers/sumatra.driver';
import { SimulationPrinterDriver } from './drivers/simulation.driver';
import { FileDownloaderService } from './services/downloader.service';
import { JobExecutorService } from './services/executor.service';
import { PrinterMonitorService } from './services/monitor.service';
import { AgentSocketClient } from './client/socket.client';

async function main() {
  console.log('==============================================');
  console.log('🖨️  TCprinter Physical Print Agent Service');
  console.log(`Backend Server: ${agentConfig.BACKEND_URL}`);
  console.log(`Printer Target: ${agentConfig.PRINTER_NAME}`);
  console.log(`Driver Mode:    ${agentConfig.USE_SIMULATION ? 'SIMULATION / DEMO' : 'SUMATRA CLI'}`);
  console.log('==============================================');

  const driver = agentConfig.USE_SIMULATION
    ? new SimulationPrinterDriver()
    : new SumatraPrinterDriver();

  const downloader = new FileDownloaderService();
  const executor = new JobExecutorService(driver, downloader);
  const monitor = new PrinterMonitorService(driver);

  const client = new AgentSocketClient(executor, monitor);
  client.start();

  process.on('SIGINT', () => {
    console.log('\nStopping print agent...');
    client.stop();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Fatal print agent error:', err);
  process.exit(1);
});
