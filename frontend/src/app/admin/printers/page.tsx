'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Printer,
  Plus,
  MagnifyingGlass,
  PencilSimple,
  Trash,
  Play,
  ArrowClockwise,
  CheckCircle,
  WarningCircle,
  Circle,
} from '@phosphor-icons/react';
import {
  getPrinters,
  createPrinter,
  updatePrinter,
  deletePrinter,
  discoverPrinters,
  triggerAgentTestPrint,
} from '../../../services/adminService';
import { AdminPrinter, DiscoveredPrinter } from '../../../types/admin.types';
import { LayerCard } from '../../../components/ui/LayerCard';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { PrinterModal } from '../../../components/admin/PrinterModal';
import { DiscoverPrintersModal } from '../../../components/admin/DiscoverPrintersModal';
import { formatDate } from '../../../lib/formatters';

export default function AdminPrintersPage() {
  const [printers, setPrinters] = useState<AdminPrinter[]>([]);
  const [discovered, setDiscovered] = useState<DiscoveredPrinter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<AdminPrinter | null>(null);
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [isDiscoverModalOpen, setIsDiscoverModalOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const loadPrinters = async () => {
    setIsLoading(true);
    try {
      const data = await getPrinters();
      setPrinters(data);
    } catch (e) {
      console.error('Failed to load printers:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPrinters();
  }, []);

  const handleScanPrinters = async () => {
    setIsDiscovering(true);
    setIsDiscoverModalOpen(true);
    try {
      const data = await discoverPrinters();
      setDiscovered(data);
    } catch (e) {
      console.error('Failed to discover printers:', e);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleAddPrinter = () => {
    setSelectedPrinter(null);
    setIsPrinterModalOpen(true);
  };

  const handleEditPrinter = (p: AdminPrinter) => {
    setSelectedPrinter(p);
    setIsPrinterModalOpen(true);
  };

  const handleDeletePrinter = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete printer "${name}"? Trays linked to this printer will also be affected.`)) {
      return;
    }
    try {
      await deletePrinter(id);
      setPrinters((prev) => prev.filter((p) => p.id !== id));
      showFeedback(`Printer "${name}" deleted successfully`);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to delete printer');
    }
  };

  const handleSavePrinter = async (payload: {
    name: string;
    driverName: string;
    connectionType: 'USB' | 'LAN' | 'VIRTUAL' | 'LOCAL';
    status: 'ONLINE' | 'OFFLINE' | 'ERROR';
  }) => {
    if (selectedPrinter) {
      const updated = await updatePrinter(selectedPrinter.id, payload);
      setPrinters((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      showFeedback(`Printer "${updated.name}" updated successfully`);
    } else {
      const created = await createPrinter(payload);
      setPrinters((prev) => [...prev, created]);
      showFeedback(`Printer "${created.name}" created successfully`);
    }
  };

  const handleImportDiscovered = async (discoveredItem: DiscoveredPrinter) => {
    try {
      const created = await createPrinter({
        name: discoveredItem.name,
        driverName: discoveredItem.driverName || discoveredItem.name,
        connectionType: discoveredItem.connectionType,
        status: discoveredItem.isOnline ? 'ONLINE' : 'OFFLINE',
      });
      setPrinters((prev) => [...prev, created]);
      showFeedback(`Discovered printer "${created.name}" imported successfully`);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to import printer');
    }
  };

  const handleTestPrint = async (printerName: string) => {
    try {
      await triggerAgentTestPrint({ printerName });
      showFeedback(`Test print dispatched for ${printerName}`);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to dispatch test print');
    }
  };

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-kumo-line">
        <div className="grid gap-1">
          <h1 className="text-xl font-semibold text-kumo-strong">
            Printers & hardware connections
          </h1>
          <p className="text-sm text-kumo-subtle">
            Manage physical and virtual printing hardware, auto-discovery, and paper telemetry
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleScanPrinters}
            disabled={isDiscovering}
            className="text-xs"
          >
            <span className="h-lh flex items-center gap-1.5">
              <MagnifyingGlass size={14} weight="thin" />
              <span>Auto-detect Windows printers</span>
            </span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleAddPrinter}
            className="text-xs"
          >
            <span className="h-lh flex items-center gap-1.5">
              <Plus size={14} weight="thin" />
              <span>Add printer</span>
            </span>
          </Button>
        </div>
      </div>

      {/* Action Notification */}
      {actionFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs flex items-center gap-2">
          <CheckCircle size={16} weight="thin" className="text-emerald-600 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Printers Table Card */}
      <LayerCard className="p-0 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-kumo-line flex items-center justify-between">
          <span className="text-xs font-semibold text-kumo-strong">
            Configured printers ({printers.length})
          </span>
          <button
            onClick={loadPrinters}
            className="text-xs text-kumo-subtle hover:text-kumo-default flex items-center gap-1"
          >
            <ArrowClockwise size={12} weight="thin" className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh list</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-kumo-default">
            <thead className="bg-kumo-recessed/50 text-xs text-kumo-subtle uppercase border-b border-kumo-line">
              <tr>
                <th className="px-5 py-3 font-medium">Printer name</th>
                <th className="px-5 py-3 font-medium">Driver</th>
                <th className="px-5 py-3 font-medium">Connection</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Sheets printed</th>
                <th className="px-5 py-3 font-medium">Cassettes</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kumo-line">
              {printers.map((printer) => (
                <tr key={printer.id} className="hover:bg-kumo-tint">
                  <td className="px-5 py-3">
                    <div className="font-medium text-kumo-strong flex items-center gap-2">
                      <Printer size={16} weight="thin" className="text-kumo-brand" />
                      <span>{printer.name}</span>
                    </div>
                    <span className="text-[11px] text-kumo-subtle font-mono">
                      Last seen: {formatDate(printer.lastSeen)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-kumo-subtle">
                    {printer.driverName}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant="neutral">{printer.connectionType}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                      <Circle
                        size={8}
                        weight="fill"
                        className={
                          printer.status === 'ONLINE'
                            ? 'text-emerald-500'
                            : printer.status === 'OFFLINE'
                            ? 'text-amber-500'
                            : 'text-red-500'
                        }
                      />
                      <span>{printer.status}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-semibold text-kumo-strong">
                      {printer.totalSheetsPrinted || 0}
                    </div>
                    <span className="text-[11px] text-kumo-subtle">total sheets</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-kumo-subtle">
                    <Link
                      href="/admin/trays"
                      className="text-kumo-brand hover:underline font-medium"
                    >
                      {printer.trays?.length || 0} trays
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleTestPrint(printer.name)}
                        className="text-xs"
                        title="Send test page to hardware"
                      >
                        <span className="h-lh flex items-center gap-1">
                          <Play size={10} weight="thin" />
                          <span>Test</span>
                        </span>
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEditPrinter(printer)}
                        className="text-xs"
                      >
                        <span className="h-lh flex items-center gap-1">
                          <PencilSimple size={12} weight="thin" />
                          <span>Edit</span>
                        </span>
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeletePrinter(printer.id, printer.name)}
                        className="text-xs"
                      >
                        <span className="h-lh flex items-center">
                          <Trash size={12} weight="thin" />
                        </span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LayerCard>

      {/* Printer Modal */}
      <PrinterModal
        printer={selectedPrinter}
        open={isPrinterModalOpen}
        onClose={() => setIsPrinterModalOpen(false)}
        onSave={handleSavePrinter}
      />

      {/* Windows Discover Modal */}
      <DiscoverPrintersModal
        open={isDiscoverModalOpen}
        onClose={() => setIsDiscoverModalOpen(false)}
        printers={discovered}
        isLoading={isDiscovering}
        onRefresh={handleScanPrinters}
        onImport={handleImportDiscovered}
      />
    </div>
  );
}
