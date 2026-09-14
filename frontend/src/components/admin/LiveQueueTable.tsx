'use client';

import React, { useState } from 'react';
import {
  ArrowsClockwise,
  FileText,
  MagnifyingGlass,
  ArrowClockwise,
  Check,
  X,
  Eye,
} from '@phosphor-icons/react';
import { AdminJob } from '../../types/admin.types';
import { LayerCard } from '../ui/LayerCard';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { JobDetailModal } from './JobDetailModal';
import { formatCurrency, formatDate } from '../../lib/formatters';

export interface LiveQueueTableProps {
  jobs: AdminJob[];
  onRefresh: () => void;
  isLoading: boolean;
  filter: string;
  onFilterChange: (status: string) => void;
  search?: string;
  onSearchChange?: (q: string) => void;
  onRetryJob?: (id: string) => Promise<void>;
  onCancelJob?: (id: string) => Promise<void>;
  onApprovePayment?: (id: string) => Promise<void>;
}

export function LiveQueueTable({
  jobs,
  onRefresh,
  isLoading,
  filter,
  onFilterChange,
  search = '',
  onSearchChange,
  onRetryJob,
  onCancelJob,
  onApprovePayment,
}: LiveQueueTableProps) {
  const [selectedJob, setSelectedJob] = useState<AdminJob | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'PRINTING':
      case 'DISPATCHED':
        return <Badge variant="brand">Printing</Badge>;
      case 'PAID':
        return <Badge variant="warning">Paid</Badge>;
      case 'PENDING_PAYMENT':
        return <Badge variant="neutral">Pending</Badge>;
      case 'FAILED':
      case 'EXPIRED':
      case 'CANCELLED':
        return <Badge variant="critical">{status.toLowerCase()}</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const filterTabs = [
    { key: 'ALL', label: 'All jobs' },
    { key: 'PENDING_PAYMENT', label: 'Pending payment' },
    { key: 'PAID', label: 'Paid' },
    { key: 'PRINTING', label: 'In spool' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'FAILED', label: 'Failed / Cancelled' },
  ];

  return (
    <LayerCard className="grid gap-4 p-0 overflow-hidden">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-kumo-line bg-kumo-canvas">
        {/* Filters */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onFilterChange(tab.key)}
              className={`px-3 py-1 text-xs font-medium rounded-md select-none shrink-0 ${
                filter === tab.key
                  ? 'bg-kumo-base text-kumo-brand shadow-sm border border-kumo-line'
                  : 'text-kumo-subtle hover:text-kumo-default hover:bg-kumo-tint'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {onSearchChange && (
            <div className="relative w-48">
              <Input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search order or file..."
                className="text-xs pr-7 py-1"
              />
            </div>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="text-xs shrink-0"
          >
            <span className="h-lh flex items-center gap-1">
              <ArrowsClockwise
                size={12}
                weight="thin"
                className={isLoading ? 'animate-spin' : ''}
              />
              <span>Refresh</span>
            </span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-kumo-default">
          <thead className="bg-kumo-recessed/50 text-xs text-kumo-subtle uppercase border-b border-kumo-line">
            <tr>
              <th className="px-5 py-3 font-medium">Order code</th>
              <th className="px-5 py-3 font-medium">Document</th>
              <th className="px-5 py-3 font-medium">Attributes</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Created</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-kumo-line">
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-xs text-kumo-subtle">
                  {isLoading ? 'Loading live queue...' : 'No print jobs found matching filter'}
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id} className="hover:bg-kumo-tint">
                  <td className="px-5 py-3 font-mono text-xs text-kumo-strong font-medium">
                    {job.orderCode}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 max-w-[200px]">
                      <FileText size={16} weight="thin" className="text-kumo-brand shrink-0" />
                      <span className="truncate text-xs font-medium text-kumo-strong" title={job.originalFileName}>
                        {job.originalFileName}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-kumo-subtle">
                    <span>
                      {job.paperSize} • {job.pageCount} pgs × {job.copies}
                    </span>
                    <span className="block text-[11px]">
                      {job.isColor ? 'Color' : 'Mono'} • {job.isDuplex ? 'Duplex' : 'Simplex'}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-semibold text-xs text-kumo-strong">
                    {formatCurrency(job.totalAmount)}
                  </td>
                  <td className="px-5 py-3">
                    {getStatusBadge(job.status)}
                  </td>
                  <td className="px-5 py-3 text-xs text-kumo-subtle font-mono text-[0.9em]">
                    {formatDate(job.createdAt)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedJob(job)}
                        className="text-xs"
                        title="View job details"
                      >
                        <span className="h-lh flex items-center gap-1">
                          <Eye size={12} weight="thin" />
                          <span>Inspect</span>
                        </span>
                      </Button>

                      {job.status === 'PENDING_PAYMENT' && onApprovePayment && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onApprovePayment(job.id)}
                          className="text-xs text-emerald-600 hover:text-emerald-700"
                          title="Manual payment approval"
                        >
                          <span className="h-lh flex items-center">
                            <Check size={12} weight="thin" />
                          </span>
                        </Button>
                      )}

                      {(job.status === 'FAILED' || job.status === 'CANCELLED') && onRetryJob && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onRetryJob(job.id)}
                          className="text-xs text-blue-600"
                          title="Retry print dispatch"
                        >
                          <span className="h-lh flex items-center">
                            <ArrowClockwise size={12} weight="thin" />
                          </span>
                        </Button>
                      )}

                      {(job.status === 'PENDING_PAYMENT' || job.status === 'PAID') && onCancelJob && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => onCancelJob(job.id)}
                          className="text-xs"
                          title="Cancel job"
                        >
                          <span className="h-lh flex items-center">
                            <X size={12} weight="thin" />
                          </span>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Inspect Modal */}
      <JobDetailModal
        job={selectedJob}
        open={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        onRetry={onRetryJob}
        onCancel={onCancelJob}
        onApprovePayment={onApprovePayment}
      />
    </LayerCard>
  );
}
