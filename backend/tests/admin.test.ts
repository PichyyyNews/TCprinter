import request from 'supertest';
import { createApp } from '../src/app';
import prisma from '../src/lib/prisma';
import { completeJob } from '../src/services/queue.service';

const app = createApp();

describe('Admin Management API & Paper Tracking', () => {
  let createdPrinterId: string;
  let createdTrayId: string;
  let createdPricingId: string;

  beforeAll(async () => {
    // Ensure at least one printer exists
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
    createdPrinterId = printer.id;
  });

  afterAll(async () => {
    // Cleanup any created test items
    if (createdTrayId) {
      await prisma.tray.deleteMany({ where: { id: createdTrayId } });
    }
    if (createdPricingId) {
      await prisma.pricingRule.deleteMany({ where: { id: createdPricingId } });
    }
    await prisma.$disconnect();
  });

  describe('Printers Endpoints', () => {
    it('GET /api/v1/admin/printers should return printer list', async () => {
      const res = await request(app).get('/api/v1/admin/printers');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('POST /api/v1/admin/printers should create a new printer', async () => {
      const testName = `Test-Printer-${Date.now()}`;
      const res = await request(app)
        .post('/api/v1/admin/printers')
        .send({
          name: testName,
          driverName: 'Generic / Text Only',
          connectionType: 'LAN',
          status: 'ONLINE',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(testName);

      // Clean up
      await prisma.printer.delete({ where: { id: res.body.data.id } });
    });

    it('GET /api/v1/admin/printers/discover should discover local Windows printers', async () => {
      const res = await request(app).get('/api/v1/admin/printers/discover');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Trays Endpoints', () => {
    it('GET /api/v1/admin/trays should return trays', async () => {
      const res = await request(app).get('/api/v1/admin/trays');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('POST /api/v1/admin/trays should create a tray and PATCH should update it', async () => {
      const trayNum = 99;
      // remove if exists
      await prisma.tray.deleteMany({
        where: { printerId: createdPrinterId, trayNumber: trayNum },
      });

      const createRes = await request(app)
        .post('/api/v1/admin/trays')
        .send({
          printerId: createdPrinterId,
          trayNumber: trayNum,
          paperSize: 'A4',
          colorCapability: 'COLOR',
          paperRemaining: 250,
          isActive: true,
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      createdTrayId = createRes.body.data.id;

      // PATCH update with auto-recovery from OUT_OF_PAPER
      await prisma.tray.update({
        where: { id: createdTrayId },
        data: { status: 'OUT_OF_PAPER', paperRemaining: 0 },
      });

      const refillRes = await request(app)
        .patch(`/api/v1/admin/trays/${createdTrayId}`)
        .send({
          paperRemaining: 500,
        });

      expect(refillRes.status).toBe(200);
      expect(refillRes.body.data.paperRemaining).toBe(500);
      expect(refillRes.body.data.status).toBe('OK'); // Verified auto-recovery!

      // Create a print job referencing this tray to test safe deletion without FK constraint violation
      const linkedJob = await prisma.printJob.create({
        data: {
          orderCode: `FK-TEST-${Date.now()}`,
          originalFileName: 'fk_test.pdf',
          pageCount: 1,
          copies: 1,
          paperSize: 'A4',
          targetTrayId: createdTrayId,
          baseAmount: 1,
          satangAmount: 10,
          totalAmount: 1.1,
          promptPayPayload: 'mock',
          status: 'COMPLETED',
          expiresAt: new Date(Date.now() + 60000),
        },
      });

      // DELETE tray should safely nullify targetTrayId on print jobs without throwing FK constraint error
      const delRes = await request(app).delete(`/api/v1/admin/trays/${createdTrayId}`);
      expect(delRes.status).toBe(200);

      const refreshedJob = await prisma.printJob.findUnique({ where: { id: linkedJob.id } });
      expect(refreshedJob?.targetTrayId).toBeNull();

      await prisma.printJob.delete({ where: { id: linkedJob.id } });
      createdTrayId = '';
    });
  });

  describe('Pricing Rules Endpoints', () => {
    it('GET /api/v1/admin/pricing should return rules', async () => {
      const res = await request(app).get('/api/v1/admin/pricing');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('POST /api/v1/admin/pricing should create rule and PATCH should update price', async () => {
      const testSize = `B5-${Date.now()}`;
      const createRes = await request(app)
        .post('/api/v1/admin/pricing')
        .send({
          paperSize: testSize,
          isColor: false,
          isDuplex: false,
          pricePerPage: 3.5,
          isActive: true,
        });

      expect(createRes.status).toBe(201);
      createdPricingId = createRes.body.data.id;

      const patchRes = await request(app)
        .patch(`/api/v1/admin/pricing/${createdPricingId}`)
        .send({
          pricePerPage: 4.0,
        });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.data.pricePerPage).toBe(4.0);

      await prisma.pricingRule.delete({ where: { id: createdPricingId } });
      createdPricingId = '';
    });
  });

  describe('System Config Endpoints', () => {
    it('GET /api/v1/admin/config should return configs and environment summary', async () => {
      const res = await request(app).get('/api/v1/admin/config');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.environment).toBeDefined();
    });

    it('POST /api/v1/admin/config should upsert config and DELETE should remove it', async () => {
      const key = `test_key_${Date.now()}`;
      const postRes = await request(app)
        .post('/api/v1/admin/config')
        .send({
          key,
          value: 'test_value_123',
          description: 'A test configuration item',
        });

      expect(postRes.status).toBe(200);
      expect(postRes.body.data.value).toBe('test_value_123');

      const delRes = await request(app).delete(`/api/v1/admin/config/${key}`);
      expect(delRes.status).toBe(200);
    });

    it('POST /api/v1/admin/config should update promptpay_target dynamically', async () => {
      const testTarget = '0899999999';
      const postRes = await request(app)
        .post('/api/v1/admin/config')
        .send({
          key: 'promptpay_target',
          value: testTarget,
          description: 'Dynamic PromptPay recipient',
        });

      expect(postRes.status).toBe(200);
      expect(postRes.body.data.value).toBe(testTarget);

      // Verify in DB
      const configInDb = await prisma.systemConfig.findUnique({
        where: { key: 'promptpay_target' },
      });
      expect(configInDb?.value).toBe(testTarget);
    });
  });

  describe('Payment Logs & Simulator', () => {
    it('GET /api/v1/admin/payments should return payment logs', async () => {
      const res = await request(app).get('/api/v1/admin/payments');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/admin/notifications should return notifications with webhookConfig', async () => {
      const res = await request(app).get('/api/v1/admin/notifications');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.webhookConfig).toBeDefined();
      expect(res.body.webhookConfig.endpointUrl).toBe('/api/v1/payments/webhook');
    });

    it('POST /api/v1/admin/notifications/test should simulate incoming bank webhook', async () => {
      const res = await request(app)
        .post('/api/v1/admin/notifications/test')
        .send({
          amount: 888.88,
          bank: 'SCB',
          rawText: 'Test simulation from Jest test suite',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Print Agent Controls', () => {
    it('GET /api/v1/admin/agent should return agent status', async () => {
      const res = await request(app).get('/api/v1/admin/agent');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.driverMode).toBeDefined();
    });

    it('POST /api/v1/admin/agent/mode should set driver mode', async () => {
      const res = await request(app)
        .post('/api/v1/admin/agent/mode')
        .send({ mode: 'SIMULATION' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mode).toBe('SIMULATION');
    });

    it('POST /api/v1/admin/agent/test-print should trigger test print', async () => {
      const res = await request(app)
        .post('/api/v1/admin/agent/test-print')
        .send({
          paperSize: 'A4',
          isColor: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Paper Usage & Tracking in completeJob', () => {
    it('should correctly decrement paper remaining and increment printer sheets counter (duplex test)', async () => {
      // Create a test tray
      const tray = await prisma.tray.create({
        data: {
          printerId: createdPrinterId,
          trayNumber: 999,
          paperSize: 'A4',
          colorCapability: 'MONOCHROME',
          paperRemaining: 100,
          isActive: true,
          status: 'OK',
        },
      });

      // Get initial printer sheets
      const printerBefore = await prisma.printer.findUnique({ where: { id: createdPrinterId } });
      const initialSheets = printerBefore?.totalSheetsPrinted || 0;

      // Create a test print job: 5 pages, 2 copies, duplex -> ceil(5/2) * 2 = 3 * 2 = 6 sheets!
      const job = await prisma.printJob.create({
        data: {
          orderCode: `TEST-JOB-${Date.now()}`,
          originalFileName: 'test_duplex.pdf',
          pageCount: 5,
          copies: 2,
          paperSize: 'A4',
          isColor: false,
          isDuplex: true,
          targetTrayId: tray.id,
          baseAmount: 15,
          satangAmount: 50,
          totalAmount: 15.5,
          promptPayPayload: 'mock_payload',
          status: 'PRINTING',
          expiresAt: new Date(Date.now() + 600000),
        },
      });

      // Call completeJob
      await completeJob(job.id, 5, 1000);

      // Verify tray paper remaining deducted by 6 (100 - 6 = 94)
      const updatedTray = await prisma.tray.findUnique({ where: { id: tray.id } });
      expect(updatedTray?.paperRemaining).toBe(94);

      // Verify printer total sheets incremented by 6
      const printerAfter = await prisma.printer.findUnique({ where: { id: createdPrinterId } });
      expect(printerAfter?.totalSheetsPrinted).toBe(initialSheets + 6);

      // Clean up
      await prisma.printJob.delete({ where: { id: job.id } });
      await prisma.tray.delete({ where: { id: tray.id } });
    });
  });

  describe('Telemetry & Stats', () => {
    it('GET /api/v1/admin/stats should return comprehensive telemetry', async () => {
      const res = await request(app).get('/api/v1/admin/stats');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalRevenue).toBeDefined();
      expect(res.body.data.totalSheetsConsumed).toBeDefined();
      expect(res.body.data.totalSheetsPrintedOnPrinters).toBeDefined();
      expect(res.body.data.totalPrinters).toBeGreaterThan(0);
    });
  });
});
