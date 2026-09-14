'use client';

import React from 'react';
import {
  CheckCircle,
  Printer,
  CircleNotch,
  Check,
  WarningCircle,
  ArrowCounterClockwise,
} from '@phosphor-icons/react';
import { useKioskStore } from '../../stores/kioskStore';
import { useKioskJob } from '../../hooks/useKioskJob';
import { LayerCard } from '../ui/LayerCard';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/cn';

export function StatusTracker() {
  const step = useKioskStore((s) => s.step);
  const activeJob = useKioskStore((s) => s.activeJob);
  const resetKiosk = useKioskStore((s) => s.resetKiosk);
  const errorMessage = useKioskStore((s) => s.errorMessage);

  const { statusMessage } = useKioskJob();

  if (step !== 'PRINTING' && step !== 'COMPLETED' && !errorMessage) {
    return null;
  }

  const isCompleted = step === 'COMPLETED' || activeJob?.status === 'COMPLETED';
  const isPrinting = (step === 'PRINTING' || activeJob?.status === 'PRINTING' || activeJob?.status === 'PAID') && !isCompleted;

  const steps = [
    { key: 'PAID', label: 'Payment confirmed' },
    { key: 'DISPATCHED', label: 'Spooling & sending to printer' },
    { key: 'PRINTING', label: 'Printing pages' },
    { key: 'COMPLETED', label: 'Ready for collection' },
  ];

  const getCurrentStepIndex = () => {
    if (isCompleted) return 3;
    if (activeJob?.status === 'PRINTING') return 2;
    if (activeJob?.status === 'DISPATCHED') return 1;
    return 0;
  };

  const currentIdx = getCurrentStepIndex();

  return (
    <LayerCard className="grid gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="grid gap-1">
          <h2 className="text-base font-semibold text-kumo-strong">
            {isCompleted ? 'Print job completed' : 'Printing in progress'}
          </h2>
          <p className="text-sm text-kumo-subtle">
            Order: <span className="font-mono text-[0.9em] text-kumo-default">{activeJob?.orderCode}</span>
          </p>
        </div>
        <Badge variant={isCompleted ? 'success' : 'brand'}>
          {isCompleted ? 'Completed' : 'Live printing'}
        </Badge>
      </div>

      {/* Step Progress Flow */}
      <div className="grid grid-cols-4 gap-2 pt-2">
        {steps.map((s, idx) => {
          const isDone = idx <= currentIdx;
          const isCurrent = idx === currentIdx && !isCompleted;

          return (
            <div key={s.key} className="grid gap-2 text-center">
              <div
                className={cn(
                  'h-1.5 w-full rounded-full transition-all duration-300',
                  isDone ? 'bg-kumo-brand' : 'bg-kumo-recessed border border-kumo-line'
                )}
              />
              <span
                className={cn(
                  'text-xs',
                  isCurrent
                    ? 'font-medium text-kumo-brand'
                    : isDone
                    ? 'text-kumo-default'
                    : 'text-kumo-subtle opacity-60'
                )}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Animated Center State */}
      <div className="flex flex-col items-center justify-center p-8 bg-kumo-canvas rounded-xl border border-kumo-line text-center">
        {isCompleted ? (
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full mb-3">
            <CheckCircle size={56} weight="thin" />
          </div>
        ) : (
          <div className="p-4 bg-orange-50 text-kumo-brand rounded-full mb-3">
            <CircleNotch size={56} weight="thin" className="animate-spin" />
          </div>
        )}

        <div className="grid gap-1 max-w-sm">
          <h3 className="text-base font-semibold text-kumo-strong">
            {isCompleted
              ? 'Your document is printed!'
              : statusMessage || 'Sending document to printer spooler...'}
          </h3>
          <p className="text-sm text-kumo-subtle">
            {isCompleted
              ? 'Please collect your printed sheets from the output tray.'
              : 'Hardware is processing paper. Please do not leave the kiosk.'}
          </p>
        </div>
      </div>

      {isCompleted && (
        <Button
          variant="primary"
          size="lg"
          onClick={resetKiosk}
          className="w-full"
        >
          <span className="h-lh flex items-center gap-2">
            <ArrowCounterClockwise size={16} weight="thin" />
            <span>Print another document</span>
          </span>
        </Button>
      )}
    </LayerCard>
  );
}
