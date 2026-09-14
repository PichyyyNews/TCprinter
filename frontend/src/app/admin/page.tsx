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
} from '@phosphor-icons/react';
import { getStats, getTrays, getJobs } from '../../services/adminService';
import { AdminStats, AdminTray, AdminJob } from '../../types/admin.types';
import { LayerCard } from '../../components/ui/LayerCard';
import { TrayControlCard } from '../../components/admin/TrayControlCard';
import { LiveQueueTable } from '../../components/admin/LiveQueueTable';
import { formatCurrency } from '../../lib/formatters';

export default function AdminDashboardPage() {
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
      console.error('Error loading admin data:', e);
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
    <div className="grid gap-8 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="grid gap-1">
          <h1 className="text-xl font-semibold text-kumo-strong">
            Admin dashboard
          </h1>
          <p className="text-sm text-kumo-subtle">
            Kiosk telemetry, paper tray management, and live print queue
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/trays"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-kumo-base border border-kumo-line rounded-md hover:bg-kumo-tint"
          >
            <Tray size={14} weight="thin" />
            <span>Manage trays</span>
          </Link>
          <Link
            href="/admin/jobs"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-kumo-base border border-kumo-line rounded-md hover:bg-kumo-tint"
          >
            <Clock size={14} weight="thin" />
            <span>Queue monitor</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
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
          <span className="text-xs text-kumo-subtle mt-1 block">All completed transfers</span>
        </LayerCard>

        <LayerCard className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-kumo-subtle">Completed jobs</span>
            <div className="p-1.5 bg-orange-50 text-kumo-brand rounded">
              <Printer size={16} weight="thin" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-semibold text-kumo-strong">
            {stats?.totalJobsCompleted || 0}
          </div>
          <span className="text-xs text-kumo-subtle mt-1 block">Successfully printed orders</span>
        </LayerCard>

        <LayerCard className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-kumo-subtle">Pages printed</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded">
              <FileText size={16} weight="thin" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-semibold text-kumo-strong">
            {stats?.totalPagesPrinted || 0}
          </div>
          <span className="text-xs text-kumo-subtle mt-1 block">Total sheets consumed</span>
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
          <span className="text-xs text-kumo-subtle mt-1 block">Jobs pending or in spool</span>
        </LayerCard>
      </div>

      {/* Paper Trays Section */}
      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <div className="grid gap-0.5">
            <h2 className="text-base font-semibold text-kumo-strong">
              Paper trays
            </h2>
            <p className="text-xs text-kumo-subtle">
              Live paper capacity and tray activation toggles
            </p>
          </div>
          <Link
            href="/admin/trays"
            className="text-xs text-kumo-brand hover:underline flex items-center gap-1 font-medium"
          >
            <span>Configure all trays</span>
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
              Recent print jobs
            </h2>
            <p className="text-xs text-kumo-subtle">
              Real-time monitoring of customer orders
            </p>
          </div>
          <Link
            href="/admin/jobs"
            className="text-xs text-kumo-brand hover:underline flex items-center gap-1 font-medium"
          >
            <span>View full queue history</span>
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
