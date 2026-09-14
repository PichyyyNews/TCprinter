'use client';

import { useMemo } from 'react';
import { useKioskStore } from '../stores/kioskStore';

export function usePriceCalculator() {
  const quote = useKioskStore((s) => s.quote);
  const config = useKioskStore((s) => s.config);

  return useMemo(() => {
    if (!quote) {
      return {
        ratePerPage: 1.5,
        totalSheets: 0,
        estimatedTotal: 0,
        estimatedBase: 0,
      };
    }

    const pageCount = quote.pageCount || 1;
    const copies = config.copies || 1;

    // Determine matching rule from pricing matrix
    const match = quote.pricingMatrix.find(
      (p) =>
        p.paperSize === config.paperSize &&
        p.isColor === config.isColor &&
        p.isDuplex === config.isDuplex
    );

    let ratePerPage = match ? match.pricePerPage : 1.5;
    if (!match) {
      if (config.paperSize === 'A3') {
        ratePerPage = config.isColor ? 10.0 : 3.0;
      } else {
        ratePerPage = config.isColor ? 5.0 : (config.isDuplex ? 2.5 : 1.5);
      }
    }

    const totalSheets = config.isDuplex ? Math.ceil(pageCount / 2) : pageCount;
    const estimatedTotal = totalSheets * ratePerPage * copies;
    const estimatedBase = Math.max(1, Math.floor(estimatedTotal));

    return {
      ratePerPage,
      totalSheets,
      estimatedTotal,
      estimatedBase,
    };
  }, [quote, config]);
}
