import { SimulationPrinterDriver } from './src/drivers/simulation.driver';
import { SumatraPrinterDriver } from './src/drivers/sumatra.driver';

async function testDrivers() {
  console.log('Testing SimulationPrinterDriver...');
  const sim = new SimulationPrinterDriver();
  const simOnline = await sim.isPrinterOnline('TC-Main-Printer');
  console.assert(simOnline === true, 'Simulation driver should report online');

  const simResult = await sim.print({
    filePath: 'test.pdf',
    printerName: 'TC-Main-Printer',
    paperSize: 'A4',
    isColor: false,
    isDuplex: true,
    duplexEdge: 'LONG_EDGE',
    trayNumber: 1,
    copies: 2,
    pageRange: '1-3',
  });
  console.assert(simResult.success === true, 'Simulated print should succeed');
  console.log('SimulationPrinterDriver passed!');

  console.log('Testing SumatraPrinterDriver instance...');
  const sumatra = new SumatraPrinterDriver();
  console.assert(sumatra.name === 'SumatraPDF-Driver', 'Driver name should match');
  console.log('SumatraPrinterDriver passed!');
}

testDrivers().catch((err) => {
  console.error(err);
  process.exit(1);
});
