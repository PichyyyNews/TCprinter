'use client';

import React, { useState } from 'react';
import { Copy, Check, Clock, UploadSimple, ShieldCheck, Lightning } from '@phosphor-icons/react';
import { useKioskStore } from '../../stores/kioskStore';
import { useKioskJob } from '../../hooks/useKioskJob';
import { sendSimulatedWebhook } from '../../services/paymentService';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatSecondsToTimer } from '../../lib/formatters';

export function PromptPayModal() {
  const step = useKioskStore((s) => s.step);
  const activeJob = useKioskStore((s) => s.activeJob);
  const setSlipModalOpen = useKioskStore((s) => s.setSlipModalOpen);
  const resetKiosk = useKioskStore((s) => s.resetKiosk);

  const { remainingSeconds } = useKioskJob();
  const [copied, setCopied] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const isOpen = step === 'PAYMENT' && !!activeJob;

  const handleCopyPayload = () => {
    if (!activeJob?.promptPayPayload) return;
    navigator.clipboard.writeText(activeJob.promptPayPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatePayment = async () => {
    if (!activeJob) return;
    setIsSimulating(true);
    try {
      await sendSimulatedWebhook(activeJob.totalAmount);
    } catch (e) {
      console.error('Simulation error:', e);
    } finally {
      setIsSimulating(false);
    }
  };

  if (!activeJob) return null;

  const basePart = Math.floor(activeJob.totalAmount);
  const satangPart = Math.round((activeJob.totalAmount - basePart) * 100)
    .toString()
    .padStart(2, '0');

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          // Allow closing/cancelling
          resetKiosk();
        }
      }}
      title="Scan PromptPay QR code"
      description="Scan with any Thai mobile banking app to complete payment"
      className="max-w-md"
    >
      <div className="grid gap-5 text-center">
        {/* Amount with highlighted satang */}
        <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-200 grid gap-1">
          <span className="text-xs text-kumo-subtle">
            Exact amount to transfer
          </span>
          <div className="text-3xl font-semibold text-kumo-strong">
            ฿{basePart}.<span className="text-kumo-brand underline decoration-wavy decoration-orange-300">{satangPart}</span>
          </div>
          <span className="text-xs text-kumo-subtle">
            Includes dynamic satang <span className="font-mono text-[0.9em]">.{satangPart}</span> for instant matching
          </span>
        </div>

        {/* QR Code image */}
        <div className="flex flex-col items-center justify-center p-3 bg-white border border-kumo-line rounded-xl">
          {activeJob.qrCodeDataUrl ? (
            <img
              src={activeJob.qrCodeDataUrl}
              alt="PromptPay QR Code"
              className="w-56 h-56 object-contain rounded-lg"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center bg-kumo-recessed rounded-lg text-sm text-kumo-subtle">
              Loading QR code...
            </div>
          )}

          <div className="flex items-center gap-2 mt-3 text-xs text-kumo-subtle">
            <span className="h-lh flex items-center">
              <Clock size={14} weight="thin" />
            </span>
            <span>Valid for:</span>
            <span className="font-mono font-medium text-kumo-brand text-[0.9em]">
              {formatSecondsToTimer(remainingSeconds)}
            </span>
          </div>
        </div>

        {/* Order code & security details */}
        <div className="flex items-center justify-between text-xs text-kumo-subtle px-1">
          <span>Order: <span className="font-mono text-[0.9em] text-kumo-default">{activeJob.orderCode}</span></span>
          <button
            onClick={handleCopyPayload}
            className="flex items-center gap-1 text-kumo-subtle hover:text-kumo-default cursor-pointer"
          >
            {copied ? <Check size={14} weight="thin" /> : <Copy size={14} weight="thin" />}
            <span>{copied ? 'Copied' : 'Copy payload'}</span>
          </button>
        </div>

        {/* Action buttons */}
        <div className="grid gap-2 pt-2 border-t border-kumo-line">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSlipModalOpen(true)}
            className="w-full text-xs"
          >
            <span className="h-lh flex items-center gap-1.5">
              <UploadSimple size={14} weight="thin" />
              <span>Transferred but not verified? Upload slip</span>
            </span>
          </Button>

          {/* Quick Demo Simulator */}
          <Button
            variant="subtle"
            size="sm"
            onClick={handleSimulatePayment}
            isLoading={isSimulating}
            className="w-full text-xs text-kumo-subtle hover:text-kumo-brand"
          >
            <span className="h-lh flex items-center gap-1.5">
              <Lightning size={14} weight="thin" />
              <span>[Demo] Simulate instant bank webhook payment</span>
            </span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
