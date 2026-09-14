'use client';

import React, { useEffect, useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AdminPrinter } from '../../types/admin.types';

interface PrinterModalProps {
  printer: AdminPrinter | null;
  open: boolean;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    driverName: string;
    connectionType: 'USB' | 'LAN' | 'VIRTUAL' | 'LOCAL';
    status: 'ONLINE' | 'OFFLINE' | 'ERROR';
  }) => Promise<void>;
}

export function PrinterModal({ printer, open, onClose, onSave }: PrinterModalProps) {
  const [name, setName] = useState('');
  const [driverName, setDriverName] = useState('');
  const [connectionType, setConnectionType] = useState<'USB' | 'LAN' | 'VIRTUAL' | 'LOCAL'>('USB');
  const [status, setStatus] = useState<'ONLINE' | 'OFFLINE' | 'ERROR'>('ONLINE');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (printer) {
      setName(printer.name);
      setDriverName(printer.driverName);
      setConnectionType(printer.connectionType || 'USB');
      setStatus(printer.status || 'ONLINE');
    } else {
      setName('');
      setDriverName('');
      setConnectionType('USB');
      setStatus('ONLINE');
    }
    setError(null);
  }, [printer, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Printer name is required');
      return;
    }
    if (!driverName.trim()) {
      setError('Driver name is required');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        driverName: driverName.trim(),
        connectionType,
        status,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to save printer');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={printer ? 'Edit printer' : 'Add new printer'}
      description="Configure hardware printer connection and driver details."
    >
      <form onSubmit={handleSubmit} className="grid gap-4 mt-2">
        {error && (
          <div className="p-2.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-kumo-default">
            Printer display name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. TC-Main-Printer or Canon G2010"
            required
          />
        </div>

        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-kumo-default">
            Driver name (Windows Spooler)
          </label>
          <Input
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            placeholder="e.g. Canon G2010 series or RICOH MP C3004"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-kumo-default">
              Connection type
            </label>
            <select
              value={connectionType}
              onChange={(e) => setConnectionType(e.target.value as any)}
              className="w-full text-xs bg-kumo-control border border-kumo-line rounded-md px-3 py-2 text-kumo-default focus:outline-none focus:ring-1 focus:ring-kumo-brand"
            >
              <option value="USB">USB Cable</option>
              <option value="LAN">Network / LAN</option>
              <option value="LOCAL">Local Port</option>
              <option value="VIRTUAL">Virtual / PDF</option>
            </select>
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-kumo-default">
              Operational status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full text-xs bg-kumo-control border border-kumo-line rounded-md px-3 py-2 text-kumo-default focus:outline-none focus:ring-1 focus:ring-kumo-brand"
            >
              <option value="ONLINE">Online / Ready</option>
              <option value="OFFLINE">Offline</option>
              <option value="ERROR">Maintenance / Error</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-kumo-line">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : printer ? 'Update printer' : 'Add printer'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
