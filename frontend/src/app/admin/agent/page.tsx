'use client';

import React, { useEffect, useState } from 'react';
import {
  Cpu,
  Circle,
  Play,
  ArrowClockwise,
  CheckCircle,
  WarningCircle,
  ShieldCheck,
  FileText,
} from '@phosphor-icons/react';
import {
  getAgentStatus,
  setAgentMode,
  triggerAgentTestPrint,
  getPrinters,
} from '../../../services/adminService';
import { AgentStatusInfo, AdminPrinter } from '../../../types/admin.types';
import { LayerCard } from '../../../components/ui/LayerCard';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { formatDate } from '../../../lib/formatters';

export default function AdminAgentPage() {
  const [status, setStatus] = useState<AgentStatusInfo | null>(null);
  const [printers, setPrinters] = useState<AdminPrinter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingMode, setIsUpdatingMode] = useState(false);
  const [isTestingPrint, setIsTestingPrint] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Test print form state
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [testPaperSize, setTestPaperSize] = useState('A4');
  const [testIsColor, setTestIsColor] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statusData, printersData] = await Promise.all([
        getAgentStatus().catch(() => null),
        getPrinters().catch(() => []),
      ]);
      setStatus(statusData);
      setPrinters(printersData);
      if (printersData.length > 0 && !selectedPrinter) {
        setSelectedPrinter(printersData[0].name);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // 5s live poll for agent
    return () => clearInterval(interval);
  }, []);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleModeChange = async (newMode: 'SIMULATION' | 'SUMATRA') => {
    setIsUpdatingMode(true);
    try {
      await setAgentMode(newMode);
      showFeedback(`Print driver mode set to ${newMode}`);
      await loadData();
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to update agent driver mode');
    } finally {
      setIsUpdatingMode(false);
    }
  };

  const handleRunTestPrint = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingPrint(true);
    try {
      const res = await triggerAgentTestPrint({
        printerName: selectedPrinter,
        paperSize: testPaperSize,
        isColor: testIsColor,
      });
      showFeedback(res.message || 'Test print dispatched successfully');
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to trigger test print');
    } finally {
      setIsTestingPrint(false);
    }
  };

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-kumo-line">
        <div className="grid gap-1">
          <h1 className="text-xl font-semibold text-kumo-strong">
            Print agent daemon & hardware drivers
          </h1>
          <p className="text-sm text-kumo-subtle">
            Manage physical spooler connection, select execution drivers, and verify printer hardware
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={loadData}
          disabled={isLoading}
          className="text-xs"
        >
          <span className="h-lh flex items-center gap-1">
            <ArrowClockwise
              size={12}
              weight="thin"
              className={isLoading ? 'animate-spin' : ''}
            />
            <span>Refresh status</span>
          </span>
        </Button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs flex items-center gap-2">
          <CheckCircle size={16} weight="thin" className="text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Agent Status Card */}
      <LayerCard className="p-5">
        <div className="flex items-center justify-between pb-3 border-b border-kumo-line">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-50 text-kumo-brand rounded">
              <Cpu size={18} weight="thin" />
            </div>
            <div className="grid gap-0.5">
              <span className="text-sm font-semibold text-kumo-strong">
                Print agent daemon status
              </span>
              <span className="text-xs text-kumo-subtle">
                WebSocket connection to print-agent process on kiosk host
              </span>
            </div>
          </div>

          <span className="flex items-center gap-2">
            <Circle
              size={10}
              weight="fill"
              className={status?.isConnected ? 'text-emerald-500' : 'text-amber-500'}
            />
            <span className="text-xs font-semibold text-kumo-strong">
              {status?.isConnected ? 'Agent connected' : 'Agent offline'}
            </span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4 text-xs">
          <div className="p-3 bg-kumo-canvas rounded-md border border-kumo-line">
            <span className="text-kumo-subtle block">Active sockets</span>
            <span className="text-base font-semibold text-kumo-strong mt-1 block">
              {status?.socketCount || 0} process{status?.socketCount === 1 ? '' : 'es'}
            </span>
          </div>

          <div className="p-3 bg-kumo-canvas rounded-md border border-kumo-line">
            <span className="text-kumo-subtle block">Hardware status</span>
            <span className="text-base font-semibold text-kumo-strong mt-1 block">
              {status?.printerStatus || 'OFFLINE'}
            </span>
          </div>

          <div className="p-3 bg-kumo-canvas rounded-md border border-kumo-line">
            <span className="text-kumo-subtle block">Active driver mode</span>
            <span className="text-base font-semibold text-kumo-brand mt-1 block">
              {status?.driverMode === 'SUMATRA' ? 'Real SumatraPDF' : 'Simulation'}
            </span>
          </div>

          <div className="p-3 bg-kumo-canvas rounded-md border border-kumo-line">
            <span className="text-kumo-subtle block">Last heartbeat</span>
            <span className="text-xs font-mono text-kumo-strong mt-1 block">
              {status?.lastHeartbeat ? formatDate(status.lastHeartbeat) : 'No heartbeat yet'}
            </span>
          </div>
        </div>
      </LayerCard>

      {/* Driver Mode Selector Card */}
      <LayerCard className="p-5">
        <div className="grid gap-1 pb-3 border-b border-kumo-line">
          <span className="text-sm font-semibold text-kumo-strong">
            Driver mode configuration
          </span>
          <p className="text-xs text-kumo-subtle">
            Select between real physical printing via SumatraPDF CLI or virtual simulation for testing
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div
            onClick={() => !isUpdatingMode && handleModeChange('SIMULATION')}
            className={`p-4 rounded-lg border cursor-pointer ${
              status?.driverMode !== 'SUMATRA'
                ? 'border-kumo-brand bg-orange-50/20 ring-1 ring-kumo-brand'
                : 'border-kumo-line bg-kumo-base hover:bg-kumo-tint'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-kumo-strong">
                Simulation driver (Demo / Test)
              </span>
              <Badge variant={status?.driverMode !== 'SUMATRA' ? 'brand' : 'neutral'}>
                {status?.driverMode !== 'SUMATRA' ? 'Active' : 'Standby'}
              </Badge>
            </div>
            <p className="text-xs text-kumo-subtle mt-2">
              Emulates physical printing delays without consuming physical paper or ink. Ideal for development, UI verification, and demos.
            </p>
          </div>

          <div
            onClick={() => !isUpdatingMode && handleModeChange('SUMATRA')}
            className={`p-4 rounded-lg border cursor-pointer ${
              status?.driverMode === 'SUMATRA'
                ? 'border-kumo-brand bg-orange-50/20 ring-1 ring-kumo-brand'
                : 'border-kumo-line bg-kumo-base hover:bg-kumo-tint'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-kumo-strong">
                SumatraPDF CLI driver (Real hardware)
              </span>
              <Badge variant={status?.driverMode === 'SUMATRA' ? 'brand' : 'neutral'}>
                {status?.driverMode === 'SUMATRA' ? 'Active' : 'Standby'}
              </Badge>
            </div>
            <p className="text-xs text-kumo-subtle mt-2">
              Directly commands the physical Windows printer spooler via SumatraPDF CLI with native paper tray, duplex, and color controls.
            </p>
          </div>
        </div>
      </LayerCard>

      {/* Hardware Test Print Trigger */}
      <LayerCard className="p-5">
        <div className="flex items-center gap-2 pb-3 border-b border-kumo-line">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded">
            <Play size={16} weight="thin" />
          </div>
          <div className="grid gap-0.5">
            <span className="text-sm font-semibold text-kumo-strong">
              Hardware test print verification
            </span>
            <span className="text-xs text-kumo-subtle">
              Send a test sheet to physical hardware to confirm paper alignment, margins, and spooler connection
            </span>
          </div>
        </div>

        <form onSubmit={handleRunTestPrint} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-kumo-default">
              Target printer
            </label>
            <select
              value={selectedPrinter}
              onChange={(e) => setSelectedPrinter(e.target.value)}
              className="w-full text-xs bg-kumo-control border border-kumo-line rounded-md px-3 py-2 text-kumo-default focus:outline-none focus:ring-1 focus:ring-kumo-brand"
              required
            >
              {printers.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name} ({p.driverName})
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-kumo-default">
              Paper size
            </label>
            <select
              value={testPaperSize}
              onChange={(e) => setTestPaperSize(e.target.value)}
              className="w-full text-xs bg-kumo-control border border-kumo-line rounded-md px-3 py-2 text-kumo-default focus:outline-none focus:ring-1 focus:ring-kumo-brand"
            >
              <option value="A4">A4</option>
              <option value="A3">A3</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="test-is-color"
              checked={testIsColor}
              onChange={(e) => setTestIsColor(e.target.checked)}
              className="w-4 h-4 text-kumo-brand rounded border-kumo-line"
            />
            <label htmlFor="test-is-color" className="text-xs text-kumo-default select-none">
              Color test mode
            </label>
          </div>

          <div className="sm:col-span-3 flex justify-end pt-2 border-t border-kumo-line">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isTestingPrint || !selectedPrinter}
              className="text-xs"
            >
              <span className="h-lh flex items-center gap-1.5">
                <Play size={12} weight="thin" />
                <span>{isTestingPrint ? 'Sending to agent...' : 'Dispatch test print'}</span>
              </span>
            </Button>
          </div>
        </form>
      </LayerCard>
    </div>
  );
}
