import prisma from '../lib/prisma';
import { logger } from '../lib/logger';

export interface PriceCalculationParams {
  paperSize: string;
  isColor: boolean;
  isDuplex: boolean;
  pageCount: number;
  copies: number;
}

export async function calculateJobPrice(params: PriceCalculationParams): Promise<{
  ratePerPage: number;
  baseAmount: number;
  rawAmount: number;
}> {
  const { paperSize, isColor, isDuplex, pageCount, copies } = params;

  const rule = await prisma.pricingRule.findUnique({
    where: {
      paperSize_isColor_isDuplex: {
        paperSize,
        isColor,
        isDuplex,
      },
    },
  });

  // Fallback defaults if rule not explicitly set
  let ratePerPage = 1.5;
  if (rule) {
    ratePerPage = rule.pricePerPage;
  } else {
    logger.warn(`No pricing rule found for ${paperSize}, color=${isColor}, duplex=${isDuplex}. Using default rate.`);
    if (paperSize === 'A3') {
      ratePerPage = isColor ? 10.0 : 3.0;
    } else {
      ratePerPage = isColor ? 5.0 : (isDuplex ? 2.5 : 1.5);
    }
  }

  // Calculate chargeable units: duplex is calculated per double-sided sheet
  const sheets = isDuplex ? Math.ceil(pageCount / 2) : pageCount;
  const rawAmount = sheets * ratePerPage * copies;
  const baseAmount = Math.max(1, Math.floor(rawAmount));

  return {
    ratePerPage,
    baseAmount,
    rawAmount,
  };
}

export async function getPricingMatrix() {
  return prisma.pricingRule.findMany({
    where: { isActive: true },
    select: {
      paperSize: true,
      isColor: true,
      isDuplex: true,
      pricePerPage: true,
    },
  });
}
