'use client';

import React from 'react';
import { ArrowRight, QrCode } from '@phosphor-icons/react';
import { useKioskStore } from '../../stores/kioskStore';
import { usePriceCalculator } from '../../hooks/usePriceCalculator';
import { createJob } from '../../services/jobService';
import { LayerCard } from '../ui/LayerCard';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../lib/formatters';

export function PriceSummaryCard() {
  const quote = useKioskStore((s) => s.quote);
  const config = useKioskStore((s) => s.config);
  const isCreatingJob = useKioskStore((s) => s.isCreatingJob);
  const setIsCreatingJob = useKioskStore((s) => s.setIsCreatingJob);
  const setActiveJob = useKioskStore((s) => s.setActiveJob);
  const setStep = useKioskStore((s) => s.setStep);
  const setErrorMessage = useKioskStore((s) => s.setErrorMessage);

  const { ratePerPage, totalSheets, estimatedTotal } = usePriceCalculator();

  if (!quote) return null;

  const handleConfirmOrder = async () => {
    setIsCreatingJob(true);
    setErrorMessage(null);

    try {
      const activeJob = await createJob({
        quoteId: quote.quoteId,
        copies: config.copies,
        pageRange: config.pageRange,
        paperSize: config.paperSize,
        isColor: config.isColor,
        isDuplex: config.isDuplex,
        duplexEdge: config.duplexEdge,
      });

      setActiveJob(activeJob);
      setStep('PAYMENT');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create order. Please try again.');
    } finally {
      setIsCreatingJob(false);
    }
  };

  return (
    <LayerCard className="grid gap-5 bg-orange-50/20 border-orange-200">
      <div className="flex items-center justify-between">
        <div className="grid gap-1">
          <span className="text-xs font-medium text-kumo-subtle">
            Estimated price
          </span>
          <div className="text-2xl font-semibold text-kumo-strong">
            ~{formatCurrency(estimatedTotal)}
          </div>
        </div>
        <div className="text-right text-xs text-kumo-subtle">
          <div>{totalSheets} {totalSheets === 1 ? 'sheet' : 'sheets'} × {config.copies} {config.copies === 1 ? 'copy' : 'copies'}</div>
          <div>{formatCurrency(ratePerPage)} per sheet</div>
        </div>
      </div>

      <div className="text-xs text-kumo-subtle bg-white p-2.5 rounded-md border border-kumo-line grid gap-1">
        <span className="font-medium text-kumo-strong">Dynamic satang allocation note</span>
        <span>
          A unique satang amount (<span className="font-mono text-[0.9em]">.01 - .99</span>) will be added upon confirmation to verify your transfer automatically without waiting.
        </span>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={handleConfirmOrder}
        isLoading={isCreatingJob}
        className="w-full"
      >
        <span className="h-lh flex items-center gap-2">
          <QrCode size={18} weight="thin" />
          <span>Confirm order & generate PromptPay QR</span>
          <ArrowRight size={16} weight="thin" />
        </span>
      </Button>
    </LayerCard>
  );
}
