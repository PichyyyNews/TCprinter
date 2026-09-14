import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding TCprinter database...');

  // 1. Create or upsert Printer
  const printer = await prisma.printer.upsert({
    where: { name: 'TC-Main-Printer' },
    update: {},
    create: {
      name: 'TC-Main-Printer',
      driverName: 'RICOH MP C3004',
      connectionType: 'USB',
      status: 'ONLINE',
    },
  });

  console.log(`Printer ready: ${printer.name}`);

  // 2. Create Trays
  const traysData = [
    {
      trayNumber: 1,
      paperSize: 'A4',
      colorCapability: 'MONOCHROME' as const,
      isActive: true,
      status: 'OK' as const,
      paperRemaining: 500,
    },
    {
      trayNumber: 2,
      paperSize: 'A4',
      colorCapability: 'COLOR' as const,
      isActive: true,
      status: 'OK' as const,
      paperRemaining: 450,
    },
    {
      trayNumber: 3,
      paperSize: 'A3',
      colorCapability: 'ANY' as const,
      isActive: true,
      status: 'OK' as const,
      paperRemaining: 250,
    },
  ];

  for (const tray of traysData) {
    await prisma.tray.upsert({
      where: {
        printerId_trayNumber: {
          printerId: printer.id,
          trayNumber: tray.trayNumber,
        },
      },
      update: {
        paperSize: tray.paperSize,
        colorCapability: tray.colorCapability,
        isActive: tray.isActive,
        status: tray.status,
        paperRemaining: tray.paperRemaining,
      },
      create: {
        printerId: printer.id,
        ...tray,
      },
    });
  }
  console.log('Trays seeded.');

  // 3. Pricing Rules
  const pricingRules = [
    { paperSize: 'A4', isColor: false, isDuplex: false, pricePerPage: 1.5 },
    { paperSize: 'A4', isColor: false, isDuplex: true, pricePerPage: 2.5 },
    { paperSize: 'A4', isColor: true, isDuplex: false, pricePerPage: 5.0 },
    { paperSize: 'A4', isColor: true, isDuplex: true, pricePerPage: 9.0 },
    { paperSize: 'A3', isColor: false, isDuplex: false, pricePerPage: 3.0 },
    { paperSize: 'A3', isColor: false, isDuplex: true, pricePerPage: 5.5 },
    { paperSize: 'A3', isColor: true, isDuplex: false, pricePerPage: 10.0 },
    { paperSize: 'A3', isColor: true, isDuplex: true, pricePerPage: 18.0 },
  ];

  for (const rule of pricingRules) {
    await prisma.pricingRule.upsert({
      where: {
        paperSize_isColor_isDuplex: {
          paperSize: rule.paperSize,
          isColor: rule.isColor,
          isDuplex: rule.isDuplex,
        },
      },
      update: {
        pricePerPage: rule.pricePerPage,
        isActive: true,
      },
      create: rule,
    });
  }
  console.log('Pricing rules seeded.');

  // 4. System Config
  const configs = [
    { key: 'promptpay_target', value: '0812345678', description: 'Default PromptPay Phone / Tax ID' },
    { key: 'kiosk_name', value: 'TCprinter Kiosk #1', description: 'Kiosk identification' },
    { key: 'webhook_tolerance_minutes', value: '15', description: 'Order valid window in minutes' },
  ];

  for (const cfg of configs) {
    await prisma.systemConfig.upsert({
      where: { key: cfg.key },
      update: { value: cfg.value },
      create: cfg,
    });
  }
  console.log('System configuration seeded.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
