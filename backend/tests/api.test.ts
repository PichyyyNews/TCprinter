import request from 'supertest';
import { createApp } from '../src/app';
import prisma from '../src/lib/prisma';

const app = createApp();

describe('API Endpoints', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('GET /health returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/v1/health returns status ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.service).toBe('TCprinter Backend API');
  });

  it('GET /api/v1/admin/trays returns active trays', async () => {
    const res = await request(app).get('/api/v1/admin/trays');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/v1/admin/pricing returns pricing rules', async () => {
    const res = await request(app).get('/api/v1/admin/pricing');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/v1/payments/webhook rejects without auth secret', async () => {
    const res = await request(app).post('/api/v1/payments/webhook').send({
      bank: 'KBANK',
      amount: 25.43,
    });
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/payments/webhook succeeds with auth secret', async () => {
    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .set('X-Webhook-Secret', 'tcp_webhook_secret_key_2026')
      .send({
        bank: 'KBANK',
        amount: 999.99,
        rawText: 'เงินเข้า 999.99 บาท',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.matched).toBe(false); // No pending job for 999.99
  });
});
