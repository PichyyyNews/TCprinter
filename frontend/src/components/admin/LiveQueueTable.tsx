'use client';

import React from 'react';
import { ArrowsClockwise, FileText } from '@phosphor-icons/react';
import { AdminJob } from '../../types/admin.types';
import { LayerCard } from '../ui/LayerCard';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatCurrency, formatDate } from '../../lib/formatters';

export interface LiveQueueTableProps {
  jobs: AdminJob[];
  onRefresh: () => void;
  isLoading: boolean;
  filter: string;
  onFilterChange: (status: string) => void;
}

export function LiveQueueTable({
  jobs,
  onRefresh,
  isLoading,
  filter,
  onFilterChange,
}: LiveQueueTableProps) {
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
        return <Badge variant="critical">{status.toLowerCase()}</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const filterTabs = [
    { key: 'ALL', label: 'All jobs' },
    { key: 'PENDING_PAYMENT', label: 'Pending payment' },
    { key: 'PRINTING', label: 'In queue' },
    { key: 'COMPLETED', label: 'Completed' },
  ];

  return (
    <LayerCard className="grid gap-4 p-0 overflow-hidden">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-kumo-line bg-kumo-canvas">
        <div className="flex items-center gap-1 overflow-x-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onFilterChange(tab.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer ${
                filter === tab.key
                  ? 'bg-kumo-base text-kumo-brand shadow-sm border border-kumo-line'
                  : 'text-kumo-subtle hover:text-kumo-default hover:bg-kumo-tint'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Button
          variant="secondary"
          size="sm"
          isLoading={isLoading}
          onClick={onRefresh}
          className="text-xs shrink-0"
        >
          <span className="h-lh flex items-center gap-1.5">
            <ArrowsClockwise size={14} weight="thin" />
            <span>Refresh queue</span>
          </span>
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-kumo-default">
          <thead className="bg-kumo-recessed/50 text-xs text-kumo-subtle uppercase border-b border-kumo-line">
            <tr>
              <th className="px-5 py-3 font-medium">Order code</th>
              <th className="px-5 py-3 font-medium">Document</th>
              <th className="px-5 py-3 font-medium">Settings</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Date & time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-kumo-line">
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-kumo-subtle">
                  No print jobs found for this filter.
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id} className="hover:bg-kumo-tint">
                  <td className="px-5 py-3.5 font-mono text-[0.9em] text-kumo-strong whitespace-nowrap">
                    {job.orderCode}
                  </td>
                  <td className="px-5 py-3.5 max-w-xs truncate">
                    <div className="flex items-center gap-2">
                      <FileText size={16} weight="thin" className="text-kumo-brand shrink-0" />
                      <span className="truncate">{job.originalFileName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-kumo-subtle whitespace-nowrap">
                    {job.paperSize} • {job.isColor ? 'Color' : 'B&W'} • {job.pageCount}p × {job.copies}
                    {job.isDuplex && ' • Duplex'}
                  </td>
                  <td className="px-5 py-3.5 font-medium whitespace-nowrap">
                    {formatCurrency(job.totalAmount)}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {getStatusBadge(job.status)}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-kumo-subtle whitespace-nowrap">
                    {formatDate(job.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </LayerCard>
  );
}
