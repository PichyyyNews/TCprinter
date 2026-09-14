'use client';

import React, { useEffect, useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AdminTray, AdminPrinter } from '../../types/admin.types';

interface TrayModalProps {
  tray: AdminTray | null;
  printers: AdminPrinter[];
  open: boolean;
  onClose: () => void;
  onSave: (payload: {
    printerId: string;
    trayNumber: number;
    paperSize: string;
    colorCapability: 'MONOCHROME' | 'COLOR' | 'ANY';
    paperRemaining: number;
    isActive: boolean;
    status: 'OK' | 'OUT_OF_PAPER' | 'PAPER_JAM' | 'DISABLED';
  }) => Promise<void>;
}

export function TrayModal({ tray, printers, open, onClose, onSave }: TrayModalProps) {
  const [printerId, setPrinterId] = useState('');
  const [trayNumber, setTrayNumber] = useState(1);
  const [paperSize, setPaperSize] = useState('A4');
  const [colorCapability, setColorCapability] = useState<'MONOCHROME' | 'COLOR' | 'ANY'>('ANY');
  const [paperRemaining, setPaperRemaining] = useState(500);
  const [isActive, setIsActive] = useState(true);
  const [status, setStatus] = useState<'OK' | 'OUT_OF_PAPER' | 'PAPER_JAM' | 'DISABLED'>('OK');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tray) {
      setPrinterId(tray.printerId || (printers[0]?.id || ''));
      setTrayNumber(tray.trayNumber);
      setPaperSize(tray.paperSize || 'A4');
      setColorCapability(tray.colorCapability || 'ANY');
      setPaperRemaining(tray.paperRemaining);
      setIsActive(tray.isActive);
      setStatus(tray.status || 'OK');
    } else {
      setPrinterId(printers[0]?.id || '');
      setTrayNumber(1);
      setPaperSize('A4');
      setColorCapability('ANY');
      setPaperRemaining(500);
      setIsActive(true);
      setStatus('OK');
    }
    setError(null);
  }, [tray, open, printers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!printerId) {
      setError('Please select a target printer');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        printerId,
        trayNumber: Number(trayNumber),
        paperSize,
        colorCapability,
        paperRemaining: Number(paperRemaining),
        isActive,
        status,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to save tray');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={tray ? `Edit tray ${tray.trayNumber}` : 'Add new paper tray'}
      description="Configure printer cassette paper size, color capability, and remaining capacity."
    >
      <form onSubmit={handleSubmit} className="grid gap-4 mt-2">
        {error && (
          <div className="p-2.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-kumo-default">
            Target printer
          </label>
          <select
            value={printerId}
            onChange={(e) => setPrinterId(e.target.value)}
            disabled={!!tray}
            className="w-full text-xs bg-kumo-control border border-kumo-line rounded-md px-3 py-2 text-kumo-default focus:outline-none focus:ring-1 focus:ring-kumo-brand"
            required
          >
            {printers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.driverName})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-kumo-default">
              Tray / Cassette number
            </label>
            <Input
              type="number"
              min={1}
              max={10}
              value={trayNumber}
              onChange={(e) => setTrayNumber(parseInt(e.target.value, 10))}
              disabled={!!tray}
              required
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-kumo-default">
              Paper size
            </label>
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value)}
              className="w-full text-xs bg-kumo-control border border-kumo-line rounded-md px-3 py-2 text-kumo-default focus:outline-none focus:ring-1 focus:ring-kumo-brand"
            >
              <option value="A4">A4 (210 x 297 mm)</option>
              <option value="A3">A3 (297 x 420 mm)</option>
              <option value="Letter">Letter</option>
              <option value="Legal">Legal</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-kumo-default">
              Color capability
            </label>
            <select
              value={colorCapability}
              onChange={(e) => setColorCapability(e.target.value as any)}
              className="w-full text-xs bg-kumo-control border border-kumo-line rounded-md px-3 py-2 text-kumo-default focus:outline-none focus:ring-1 focus:ring-kumo-brand"
            >
              <option value="ANY">Any (Color & Mono)</option>
              <option value="MONOCHROME">Monochrome only</option>
              <option value="COLOR">Color only</option>
            </select>
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-kumo-default">
              Paper remaining (sheets)
            </label>
            <Input
              type="number"
              min={0}
              max={5000}
              value={paperRemaining}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10) || 0;
                setPaperRemaining(val);
                if (val > 0 && status === 'OUT_OF_PAPER') {
                  setStatus('OK');
                }
              }}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-kumo-default">
              Cassette status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full text-xs bg-kumo-control border border-kumo-line rounded-md px-3 py-2 text-kumo-default focus:outline-none focus:ring-1 focus:ring-kumo-brand"
            >
              <option value="OK">Ready / OK</option>
              <option value="OUT_OF_PAPER">Out of paper</option>
              <option value="PAPER_JAM">Paper jam</option>
              <option value="DISABLED">Disabled</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="tray-is-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-kumo-brand rounded border-kumo-line"
            />
            <label htmlFor="tray-is-active" className="text-xs text-kumo-default select-none">
              Tray enabled for dispatch
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-kumo-line">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : tray ? 'Update tray' : 'Add tray'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
