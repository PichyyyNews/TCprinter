'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react';
import { getJobs } from '../../../services/adminService';
import { AdminJob } from '../../../types/admin.types';
import { LiveQueueTable } from '../../../components/admin/LiveQueueTable';

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getJobs(filter, 1, 50);
      setJobs(data.jobs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000); // 8s live refresh
    return () => clearInterval(interval);
  }, [filter]);

  return (
    <div className="grid gap-6 py-2">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="p-1.5 rounded-md border border-kumo-line hover:bg-kumo-tint text-kumo-subtle hover:text-kumo-default"
        >
          <ArrowLeft size={16} weight="thin" />
        </Link>
        <div className="grid gap-0.5">
          <h1 className="text-xl font-semibold text-kumo-strong">
            Live queue & transaction audit log
          </h1>
          <p className="text-sm text-kumo-subtle">
            All customer print orders, payment matching states, and hardware events
          </p>
        </div>
      </div>

      <LiveQueueTable
        jobs={jobs}
        onRefresh={loadData}
        isLoading={isLoading}
        filter={filter}
        onFilterChange={setFilter}
      />
    </div>
  );
}
