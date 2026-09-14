'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle,
} from '@phosphor-icons/react';
import {
  getJobs,
  retryJob,
  cancelJob,
  approveJobPayment,
} from '../../../services/adminService';
import { AdminJob } from '../../../types/admin.types';
import { LiveQueueTable } from '../../../components/admin/LiveQueueTable';

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getJobs(filter, 1, 50, search);
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
  }, [filter, search]);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleRetryJob = async (id: string) => {
    try {
      const res = await retryJob(id);
      showFeedback(`Job ${res.orderCode} re-dispatched to print agent`);
      loadData();
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to retry job');
    }
  };

  const handleCancelJob = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this job?')) return;
    try {
      const res = await cancelJob(id);
      showFeedback(`Job ${res.orderCode} cancelled`);
      loadData();
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to cancel job');
    }
  };

  const handleApprovePayment = async (id: string) => {
    if (!confirm('Approve payment manually for this job? It will be sent to the print agent immediately.')) return;
    try {
      const res = await approveJobPayment(id);
      showFeedback(`Payment approved for ${res.orderCode} and sent to agent`);
      loadData();
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to approve payment');
    }
  };

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-kumo-line">
        <div className="grid gap-1">
          <h1 className="text-xl font-semibold text-kumo-strong">
            Live queue & print audit log
          </h1>
          <p className="text-sm text-kumo-subtle">
            All customer print orders, payment verification states, and hardware events
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs flex items-center gap-2">
          <CheckCircle size={16} weight="thin" className="text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      <LiveQueueTable
        jobs={jobs}
        onRefresh={loadData}
        isLoading={isLoading}
        filter={filter}
        onFilterChange={setFilter}
        search={search}
        onSearchChange={setSearch}
        onRetryJob={handleRetryJob}
        onCancelJob={handleCancelJob}
        onApprovePayment={handleApprovePayment}
      />
    </div>
  );
}
