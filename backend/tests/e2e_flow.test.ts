import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { createApp } from '../src/app';
import prisma from '../src/lib/prisma';
import { env } from '../src/config/env.config';

const app = createApp();

const validPdfString = `%PDF-1.1
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
                  /BaseFont /Times-Roman
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
    0 0 Td
    (TCprinter Test Document) Tj
  ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000018 00000 n 
0000000077 00000 n 
0000000178 00000 n 
0000000457 00000 n 
trailer
  <<  /Root 1 0 R
      /Size 5
  >>
startxref
565
%%EOF
`;

describe('End-to-End Kiosk Print & Payment Lifecycle', () => {
  const testPdfPath = path.join(__dirname, 'temp_sample.pdf');

  beforeAll(() => {
    fs.writeFileSync(testPdfPath, validPdfString);
  });

  afterAll(async () => {
    if (fs.existsSync(testPdfPath)) {
      fs.unlinkSync(testPdfPath);
    }
    await prisma.$disconnect();
  });

  it('runs complete 8-step print job lifecycle from upload to completion', async () => {
    // 1. Upload PDF for Quote
    const quoteRes = await request(app)
      .post('/api/v1/jobs/quote')
      .attach('file', testPdfPath);

    expect(quoteRes.status).toBe(200);
    expect(quoteRes.body.success).toBe(true);
    const { quoteId, pageCount, availableTrays } = quoteRes.body.data;
    expect(quoteId).toBeDefined();
    expect(pageCount).toBe(1);
    expect(availableTrays.length).toBeGreaterThan(0);

    // 2. Create Print Job with configuration
    const createRes = await request(app)
      .post('/api/v1/jobs/create')
      .send({
        quoteId,
        copies: 1,
        paperSize: 'A4',
        isColor: false,
        isDuplex: false,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    const { jobId, orderCode, totalAmount, satangAmount, promptPayPayload } = createRes.body.data;
    expect(jobId).toBeDefined();
    expect(orderCode).toMatch(/^TCP-/);
    expect(totalAmount).toBeGreaterThan(0);
    expect(satangAmount).toBeGreaterThanOrEqual(1);
    expect(satangAmount).toBeLessThanOrEqual(99);
    expect(promptPayPayload).toContain('000201010212');

    // 3. Verify Job Status is PENDING_PAYMENT
    const statusRes1 = await request(app).get(`/api/v1/jobs/${jobId}/status`);
    expect(statusRes1.status).toBe(200);
    expect(statusRes1.body.data.status).toBe('PENDING_PAYMENT');

    // 4. Simulate Android Notification Webhook payment
    const webhookRes = await request(app)
      .post('/api/v1/payments/webhook')
      .set('X-Webhook-Secret', env.WEBHOOK_SECRET)
      .send({
        bank: 'KBANK',
        amount: totalAmount,
        rawText: `เงินเข้า ${totalAmount} บาท`,
        timestamp: new Date().toISOString(),
      });

    expect(webhookRes.status).toBe(200);
    expect(webhookRes.body.success).toBe(true);
    expect(webhookRes.body.matched).toBe(true);
    expect(webhookRes.body.jobId).toBe(jobId);

    // 5. Verify Job Status transitioned to DISPATCHED
    const statusRes2 = await request(app).get(`/api/v1/jobs/${jobId}/status`);
    expect(statusRes2.status).toBe(200);
    expect(statusRes2.body.data.status).toBe('DISPATCHED');

    // 6. Print Agent downloads PDF
    const downloadRes = await request(app)
      .get(`/api/v1/agent/jobs/${jobId}/download`)
      .set('X-Agent-Token', env.AGENT_TOKEN);

    expect(downloadRes.status).toBe(200);
    expect(downloadRes.headers['content-type']).toBe('application/pdf');

    // 7. Print Agent reports completion
    const completeRes = await request(app)
      .post(`/api/v1/agent/jobs/${jobId}/complete`)
      .set('X-Agent-Token', env.AGENT_TOKEN)
      .send({
        status: 'COMPLETED',
        printedPages: 1,
        executionDurationMs: 1200,
      });

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.success).toBe(true);

    // 8. Verify Job Status is COMPLETED
    const finalStatus = await request(app).get(`/api/v1/jobs/${jobId}/status`);
    expect(finalStatus.status).toBe(200);
    expect(finalStatus.body.data.status).toBe('COMPLETED');
    expect(finalStatus.body.data.completedAt).toBeDefined();
  });
});
