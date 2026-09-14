'use client';

import React from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { AdminJob } from '../../types/admin.types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { FileText, ArrowClockwise, Check, X } from '@phosphor-icons/react';

interface JobDetailModalProps {
  job: AdminJob | null;
  open: boolean;
  onClose: () => void;
  onRetry?: (id: string) => Promise<void>;
  onCancel?: (id: string) => Promise<void>;
  onApprovePayment?: (id: string) => Promise<void>;
}

export function JobDetailModal({
  job,
  open,
  onClose,
  onRetry,
  onCancel,
  onApprovePayment,
}: JobDetailModalProps) {
  if (!job) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Job details: ${job.orderCode}`}
      description="Inspect customer order parameters, paper configuration, and hardware dispatch events."
    >
      <div className="grid gap-4 mt-2">
        {/* Basic summary */}
        <div className="p-3 bg-kumo-canvas rounded-lg border border-kumo-line flex items-center justify-between">
          <div className="grid gap-0.5">
            <span className="text-xs text-kumo-subtle">File name</span>
            <span className="text-sm font-medium text-kumo-strong truncate max-w-xs flex items-center gap-1.5">
              <FileText size={16} weight="thin" className="text-kumo-brand" />
              <span>{job.originalFileName}</span>
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-kumo-subtle">Total amount</span>
            <div className="text-base font-semibold text-kumo-strong">
              {formatCurrency(job.totalAmount)}
            </div>
          </div>
        </div>

        {/* Specifications grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 bg-kumo-base border border-kumo-line rounded">
            <span className="text-kumo-subtle block">Status</span>
            <span className="font-semibold text-kumo-strong mt-0.5 block">{job.status}</span>
          </div>
          <div className="p-2.5 bg-kumo-base border border-kumo-line rounded">
            <span className="text-kumo-subtle block">Paper format</span>
            <span className="font-semibold text-kumo-strong mt-0.5 block">{job.paperSize}</span>
          </div>
          <div className="p-2.5 bg-kumo-base border border-kumo-line rounded">
            <span className="text-kumo-subtle block">Pages / Copies</span>
            <span className="font-semibold text-kumo-strong mt-0.5 block">
              {job.pageCount} pgs × {job.copies}
            </span>
          </div>
          <div className="p-2.5 bg-kumo-base border border-kumo-line rounded">
            <span className="text-kumo-subtle block">Color / Duplex</span>
            <span className="font-semibold text-kumo-strong mt-0.5 block">
              {job.isColor ? 'Color' : 'Mono'} • {job.isDuplex ? 'Duplex' : 'Simplex'}
            </span>
          </div>
        </div>

        {/* Hardware tray & printer info */}
        <div className="p-3 bg-kumo-base border border-kumo-line rounded-lg grid gap-1 text-xs">
          <span className="text-kumo-subtle">Hardware Target</span>
          <div className="text-kumo-strong font-medium">
            {job.targetTray?.printer?.name || 'Main Printer'} — Tray #{job.targetTray?.trayNumber || 1} ({job.targetTray?.paperSize || 'A4'})
          </div>
          {job.failureReason && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 text-red-700 rounded text-xs">
              <strong>Failure reason:</strong> {job.failureReason}
            </div>
          )}
        </div>

        {/* Timestamps */}
        <div className="grid grid-cols-2 gap-2 text-xs text-kumo-subtle border-t border-kumo-line pt-3">
          <div>
            <span>Created at: </span>
            <span className="text-kumo-strong font-mono text-[0.9em]">{formatDate(job.createdAt)}</span>
          </div>
          {job.paidAt && (
            <div>
              <span>Paid at: </span>
              <span className="text-kumo-strong font-mono text-[0.9em]">{formatDate(job.paidAt)}</span>
            </div>
          )}
          {job.completedAt && (
            <div>
              <span>Completed at: </span>
              <span className="text-kumo-strong font-mono text-[0.9em]">{formatDate(job.completedAt)}</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-kumo-line">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>

          <div className="flex items-center gap-2">
            {job.status === 'PENDING_PAYMENT' && onApprovePayment && (
              <Button
                variant="primary"
                size="sm"
                onClick={async () => {
                  await onApprovePayment(job.id);
                  onClose();
                }}
                className="text-xs"
              >
                <span className="h-lh flex items-center gap-1">
                  <Check size={12} weight="thin" />
                  <span>Manual approve payment</span>
                </span>
              </Button>
            )}

            {(job.status === 'FAILED' || job.status === 'CANCELLED') && onRetry && (
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  await onRetry(job.id);
                  onClose();
                }}
                className="text-xs"
              >
                <span className="h-lh flex items-center gap-1">
                  <ArrowClockwise size={12} weight="thin" />
                  <span>Retry print</span>
                </span>
              </Button>
            )}

            {(job.status === 'PENDING_PAYMENT' || job.status === 'PAID') && onCancel && (
              <Button
                variant="danger"
                size="sm"
                onClick={async () => {
                  await onCancel(job.id);
                  onClose();
                }}
                className="text-xs"
              >
                <span className="h-lh flex items-center gap-1">
                  <X size={12} weight="thin" />
                  <span>Cancel job</span>
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
