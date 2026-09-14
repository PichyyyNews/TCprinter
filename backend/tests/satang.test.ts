import { allocateSatangForAmount } from '../src/services/satang.service';
import prisma from '../src/lib/prisma';

describe('Satang Allocation Engine', () => {
  beforeAll(async () => {
    // Clean up any test jobs
    await prisma.paymentLog.deleteMany({});
    await prisma.printJob.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('allocates a satang between 1 and 99', async () => {
    const satang = await allocateSatangForAmount(25);
    expect(satang).toBeGreaterThanOrEqual(1);
    expect(satang).toBeLessThanOrEqual(99);
  });

  it('avoids collision when multiple satangs are occupied for the same base amount', async () => {
    const expiresAt = new Date(Date.now() + 900 * 1000);
    // Artificially reserve satang 10, 11, 12 for baseAmount 50
    for (const s of [10, 11, 12]) {
      await prisma.printJob.create({
        data: {
          orderCode: `TEST-SATANG-${s}-${Date.now()}`,
          originalFileName: 'test.pdf',
          pageCount: 1,
          copies: 1,
          baseAmount: 50,
          satangAmount: s,
          totalAmount: 50 + s / 100,
          promptPayPayload: 'MOCK',
          status: 'PENDING_PAYMENT',
          expiresAt,
        },
      });
    }

    // Allocate 10 new satangs for 50; none should be 10, 11, or 12
    for (let i = 0; i < 10; i++) {
      const allocated = await allocateSatangForAmount(50);
      expect([10, 11, 12]).not.toContain(allocated);
    }
  });
});
