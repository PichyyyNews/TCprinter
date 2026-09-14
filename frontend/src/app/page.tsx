'use client';

import React from 'react';
import { useKioskStore } from '../stores/kioskStore';
import { FileUploadZone } from '../components/kiosk/FileUploadZone';
import { PdfPreviewCard } from '../components/kiosk/PdfPreviewCard';
import { PrintConfigForm } from '../components/kiosk/PrintConfigForm';
import { PriceSummaryCard } from '../components/kiosk/PriceSummaryCard';
import { PromptPayModal } from '../components/kiosk/PromptPayModal';
import { StatusTracker } from '../components/kiosk/StatusTracker';
import { SlipUploadModal } from '../components/kiosk/SlipUploadModal';

export default function KioskPage() {
  const step = useKioskStore((s) => s.step);
  const quote = useKioskStore((s) => s.quote);

  return (
    <div className="grid gap-6 max-w-3xl mx-auto py-2">
      {/* Page Title & Heading (Sentence case, no font-bold) */}
      <div className="grid gap-1">
        <h1 className="text-xl font-semibold text-kumo-strong">
          Self-service document printing
        </h1>
        <p className="text-sm text-kumo-subtle">
          Upload your PDF document, select paper options, and scan to pay via PromptPay
        </p>
      </div>

      {/* Step 1: Upload Dropzone */}
      {step === 'UPLOAD' && (
        <div className="grid gap-4">
          <FileUploadZone />
        </div>
      )}

      {/* Step 2 & 3: Configure Settings & Review Price */}
      {step === 'CONFIG' && quote && (
        <div className="grid gap-6">
          <PdfPreviewCard />
          <PrintConfigForm />
          <PriceSummaryCard />
        </div>
      )}

      {/* Step 4, 5, 7, 8: Real-time Status Tracker & Completion */}
      {(step === 'PRINTING' || step === 'COMPLETED') && (
        <StatusTracker />
      )}

      {/* PromptPay QR Modal (Active during PAYMENT step) */}
      <PromptPayModal />

      {/* Fallback Slip Upload Modal */}
      <SlipUploadModal />
    </div>
  );
}
