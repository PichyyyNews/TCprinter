import { calculateJobPrice } from '../src/services/pricing.service';
import prisma from '../src/lib/prisma';

describe('Pricing Engine', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('calculates single-sided monochrome A4 print correctly', async () => {
    // 10 pages, 1 copy, 1.50 THB/page = 15.00
    const result = await calculateJobPrice({
      paperSize: 'A4',
      isColor: false,
      isDuplex: false,
      pageCount: 10,
      copies: 1,
    });
    expect(result.ratePerPage).toBe(1.5);
    expect(result.rawAmount).toBe(15.0);
    expect(result.baseAmount).toBe(15);
  });

  it('calculates double-sided monochrome A4 print correctly (sheets = ceil(pages/2))', async () => {
    // 18 pages, duplex: 9 sheets * 2.50 = 22.50 -> baseAmount = 22
    const result = await calculateJobPrice({
      paperSize: 'A4',
      isColor: false,
      isDuplex: true,
      pageCount: 18,
      copies: 1,
    });
    expect(result.ratePerPage).toBe(2.5);
    expect(result.rawAmount).toBe(22.5);
    expect(result.baseAmount).toBe(22);
  });

  it('multiplies price by copies correctly', async () => {
    // 4 pages, color, duplex (2 sheets) * 9.00 * 2 copies = 36.00
    const result = await calculateJobPrice({
      paperSize: 'A4',
      isColor: true,
      isDuplex: true,
      pageCount: 4,
      copies: 2,
    });
    expect(result.rawAmount).toBe(36.0);
    expect(result.baseAmount).toBe(36);
  });
});
