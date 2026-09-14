'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CurrencyBtc,
  Printer,
  FileText,
  Clock,
  ArrowRight,
  Tray,
  Cpu,
  CreditCard,
  BellSimpleRinging,
  GearSix,
  CheckCircle,
  WarningCircle,
} from '@phosphor-icons/react';
import { getStats, getTrays, getJobs } from '../../services/adminService';
import { AdminStats, AdminTray, AdminJob } from '../../types/admin.types';
import { LayerCard } from '../../components/ui/LayerCard';
import { TrayControlCard } from '../../components/admin/TrayControlCard';
import { LiveQueueTable } from '../../components/admin/LiveQueueTable';
import { formatCurrency } from '../../lib/formatters';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [trays, setTrays] = useState<AdminTray[]>([]);
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, traysData, jobsData] = await Promise.all([
        getStats().catch(() => null),
        getTrays().catch(() => []),
        getJobs(filter, 1, 10).catch(() => ({ jobs: [], total: 0, totalPages: 1 })),
      ]);

      setStats(statsData);
      setTrays(traysData);
      setJobs(jobsData.jobs);
    } catch (e) {
      console.error('Error loading admin overview data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // 10s live poll
    return () => clearInterval(interval);
  }, [filter]);

  const handleTrayUpdated = (updated: AdminTray) => {
    setTrays((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  return (
    <div className="grid gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-kumo-line">
        <div className="grid gap-1">
          <h1 className="text-xl font-semibold text-kumo-strong">
            Overview & system telemetry
          </h1>
          <p className="text-sm text-kumo-subtle">
            Real-time kiosk metrics, hardware health, and operational status
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/printers"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-kumo-base border border-kumo-line rounded-md hover:bg-kumo-tint"
          >
            <Printer size={14} weight="thin" />
            <span>Printers</span>
          </Link>
          <Link
            href="/admin/agent"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-kumo-base border border-kumo-line rounded-md hover:bg-kumo-tint"
          >
            <Cpu size={14} weight="thin" />
            <span>Print agent</span>
          </Link>
        </div>
      </div>

      {/* Telemetry Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <LayerCard className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-kumo-subtle">Total revenue</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded">
              <CurrencyBtc size={16} weight="thin" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-semibold text-kumo-strong">
            {formatCurrency(stats?.totalRevenue || 0)}
          </div>
          <span className="text-xs text-kumo-subtle mt-1 block">Completed payments</span>
        </LayerCard>

        <LayerCard className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-kumo-subtle">Paper sheets printed</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded">
              <FileText size={16} weight="thin" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-semibold text-kumo-strong">
            {stats?.totalSheetsConsumed || stats?.totalPagesPrinted || 0}
          </div>
          <span className="text-xs text-kumo-subtle mt-1 block">Estimated paper used</span>
        </LayerCard>

        <LayerCard className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-kumo-subtle">Paper in cassettes</span>
            <div className="p-1.5 bg-orange-50 text-kumo-brand rounded">
              <Tray size={16} weight="thin" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-semibold text-kumo-strong">
            {stats?.totalPaperRemaining !== undefined ? stats.totalPaperRemaining : '—'}
          </div>
          <span className="text-xs text-kumo-subtle mt-1 block">Sheets remaining across trays</span>
        </LayerCard>

        <LayerCard className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-kumo-subtle">Active queue</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded">
              <Clock size={16} weight="thin" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-semibold text-kumo-strong">
            {stats?.activeQueuedJobs || 0}
          </div>
          <span className="text-xs text-kumo-subtle mt-1 block">In spool or processing</span>
        </LayerCard>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/admin/printers"
          className="p-3 bg-kumo-base border border-kumo-line rounded-lg hover:bg-kumo-tint flex items-center gap-3"
        >
          <div className="p-2 bg-kumo-canvas text-kumo-default rounded border border-kumo-line">
            <Printer size={18} weight="thin" />
          </div>
          <div className="grid gap-0.5">
            <span className="text-xs font-semibold text-kumo-strong">Printers</span>
            <span className="text-[11px] text-kumo-subtle">CRUD & auto-discovery</span>
          </div>
        </Link>

        <Link
          href="/admin/payments"
          className="p-3 bg-kumo-base border border-kumo-line rounded-lg hover:bg-kumo-tint flex items-center gap-3"
        >
          <div className="p-2 bg-kumo-canvas text-kumo-default rounded border border-kumo-line">
            <CreditCard size={18} weight="thin" />
          </div>
          <div className="grid gap-0.5">
            <span className="text-xs font-semibold text-kumo-strong">Payments</span>
            <span className="text-[11px] text-kumo-subtle">PromptPay & logs</span>
          </div>
        </Link>

        <Link
          href="/admin/notifications"
          className="p-3 bg-kumo-base border border-kumo-line rounded-lg hover:bg-kumo-tint flex items-center gap-3"
        >
          <div className="p-2 bg-kumo-canvas text-kumo-default rounded border border-kumo-line">
            <BellSimpleRinging size={18} weight="thin" />
          </div>
          <div className="grid gap-0.5">
            <span className="text-xs font-semibold text-kumo-strong">Webhooks</span>
            <span className="text-[11px] text-kumo-subtle">Mobile notifications</span>
          </div>
        </Link>

        <Link
          href="/admin/settings"
          className="p-3 bg-kumo-base border border-kumo-line rounded-lg hover:bg-kumo-tint flex items-center gap-3"
        >
          <div className="p-2 bg-kumo-canvas text-kumo-default rounded border border-kumo-line">
            <GearSix size={18} weight="thin" />
          </div>
          <div className="grid gap-0.5">
            <span className="text-xs font-semibold text-kumo-strong">Settings</span>
            <span className="text-[11px] text-kumo-subtle">Configs & environment</span>
          </div>
        </Link>
      </div>

      {/* Paper Trays Section */}
      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <div className="grid gap-0.5">
            <h2 className="text-base font-semibold text-kumo-strong">
              Paper tray cassettes
            </h2>
            <p className="text-xs text-kumo-subtle">
              Live capacity and paper level meters
            </p>
          </div>
          <Link
            href="/admin/trays"
            className="text-xs text-kumo-brand hover:underline flex items-center gap-1 font-medium"
          >
            <span>Manage all trays</span>
            <ArrowRight size={12} weight="thin" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {trays.map((tray) => (
            <TrayControlCard
              key={tray.id}
              tray={tray}
              onUpdated={handleTrayUpdated}
            />
          ))}
        </div>
      </div>

      {/* Live Queue Section */}
      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <div className="grid gap-0.5">
            <h2 className="text-base font-semibold text-kumo-strong">
              Live print queue
            </h2>
            <p className="text-xs text-kumo-subtle">
              Real-time monitoring of customer orders and transactions
            </p>
          </div>
          <Link
            href="/admin/jobs"
            className="text-xs text-kumo-brand hover:underline flex items-center gap-1 font-medium"
          >
            <span>Full queue audit</span>
            <ArrowRight size={12} weight="thin" />
          </Link>
        </div>

        <LiveQueueTable
          jobs={jobs}
          onRefresh={loadData}
          isLoading={isLoading}
          filter={filter}
          onFilterChange={setFilter}
        />
      </div>
    </div>
  );
}
