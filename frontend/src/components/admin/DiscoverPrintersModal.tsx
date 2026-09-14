'use client';

import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { DiscoveredPrinter } from '../../types/admin.types';
import { Plus, ArrowClockwise, Circle } from '@phosphor-icons/react';

interface DiscoverPrintersModalProps {
  open: boolean;
  onClose: () => void;
  printers: DiscoveredPrinter[];
  isLoading: boolean;
  onRefresh: () => void;
  onImport: (printer: DiscoveredPrinter) => Promise<void>;
}

export function DiscoverPrintersModal({
  open,
  onClose,
  printers,
  isLoading,
  onRefresh,
  onImport,
}: DiscoverPrintersModalProps) {
  const [importingName, setImportingName] = useState<string | null>(null);

  const handleImport = async (p: DiscoveredPrinter) => {
    setImportingName(p.name);
    try {
      await onImport(p);
    } finally {
      setImportingName(null);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Discovered Windows printers"
      description="Printers and spoolers detected via PowerShell Get-Printer on this system."
    >
      <div className="grid gap-4 mt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-kumo-subtle">
            {printers.length} printer{printers.length === 1 ? '' : 's'} detected on host
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="text-xs"
          >
            <span className="h-lh flex items-center gap-1">
              <ArrowClockwise
                size={12}
                weight="thin"
                className={isLoading ? 'animate-spin' : ''}
              />
              <span>Rescan</span>
            </span>
          </Button>
        </div>

        {printers.length === 0 ? (
          <div className="p-6 text-center text-xs text-kumo-subtle bg-kumo-canvas rounded border border-kumo-line">
            {isLoading ? 'Scanning host system for printers...' : 'No printers detected. Ensure printer drivers are installed in Windows.'}
          </div>
        ) : (
          <div className="border border-kumo-line rounded-md overflow-hidden max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-kumo-recessed/50 text-kumo-subtle uppercase border-b border-kumo-line">
                <tr>
                  <th className="px-3 py-2 font-medium">Printer name</th>
                  <th className="px-3 py-2 font-medium">Port / Type</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kumo-line">
                {printers.map((p) => (
                  <tr key={p.name} className="hover:bg-kumo-tint">
                    <td className="px-3 py-2">
                      <div className="font-medium text-kumo-strong">{p.name}</div>
                      <div className="text-[11px] text-kumo-subtle truncate max-w-[160px]">
                        {p.driverName}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="neutral">{p.connectionType}</Badge>
                      <span className="text-[10px] text-kumo-subtle ml-1 block font-mono">
                        {p.portName}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Circle
                          size={6}
                          weight="fill"
                          className={p.isOnline ? 'text-emerald-500' : 'text-amber-500'}
                        />
                        <span>{p.isOnline ? 'Ready' : 'Offline'}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleImport(p)}
                        disabled={importingName === p.name}
                        className="text-xs"
                      >
                        <span className="h-lh flex items-center gap-1">
                          <Plus size={10} weight="thin" />
                          <span>{importingName === p.name ? 'Adding...' : 'Import'}</span>
                        </span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-end pt-2 border-t border-kumo-line">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
