'use client';

import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  CurrencyBtc,
  CheckCircle,
  Clock,
  ArrowClockwise,
  PencilSimple,
  QrCode,
  ShieldCheck,
} from '@phosphor-icons/react';
import {
  getPaymentLogs,
  getSystemConfigs,
  upsertSystemConfig,
  approveJobPayment,
} from '../../../services/adminService';
import { PaymentLogItem, SystemConfigItem, EnvironmentSummary } from '../../../types/admin.types';
import { LayerCard } from '../../../components/ui/LayerCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { formatCurrency, formatDate } from '../../../lib/formatters';

export default function AdminPaymentsPage() {
  const [logs, setLogs] = useState<PaymentLogItem[]>([]);
  const [configs, setConfigs] = useState<SystemConfigItem[]>([]);
  const [envSummary, setEnvSummary] = useState<EnvironmentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [matchedFilter, setMatchedFilter] = useState('ALL');
  const [promptPayTarget, setPromptPayTarget] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [logsData, configData] = await Promise.all([
        getPaymentLogs(methodFilter, matchedFilter, 1, 50).catch(() => ({ logs: [], total: 0, totalPages: 1 })),
        getSystemConfigs().catch(() => ({ configs: [], environment: null as any })),
      ]);

      setLogs(logsData.logs);
      setConfigs(configData.configs);
      setEnvSummary(configData.environment);

      const ppCfg = configData.configs.find((c) => c.key === 'promptpay_target');
      const merchCfg = configData.configs.find((c) => c.key === 'merchant_name');
      setPromptPayTarget(ppCfg?.value || configData.environment?.PROMPTPAY_TARGET || '0812345678');
      setMerchantName(merchCfg?.value || 'TCprinter Kiosk');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [methodFilter, matchedFilter]);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      await Promise.all([
        upsertSystemConfig({
          key: 'promptpay_target',
          value: promptPayTarget.trim(),
          description: 'Default PromptPay Phone number or Tax ID',
        }),
        upsertSystemConfig({
          key: 'merchant_name',
          value: merchantName.trim(),
          description: 'Display merchant name in kiosk PromptPay dialog',
        }),
      ]);
      setIsEditingConfig(false);
      showFeedback('PromptPay gateway settings updated successfully');
      loadData();
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to update gateway settings');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleApproveJob = async (jobId: string) => {
    try {
      await approveJobPayment(jobId);
      showFeedback('Payment manually approved and dispatched to agent');
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
            Payment gateway & transaction logs
          </h1>
          <p className="text-sm text-kumo-subtle">
            PromptPay merchant recipient configuration, dynamic satang validation, and transaction audit log
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs flex items-center gap-2">
          <CheckCircle size={16} weight="thin" className="text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Gateway Configuration Card */}
      <LayerCard className="p-5">
        <div className="flex items-center justify-between pb-3 border-b border-kumo-line">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-50 text-kumo-brand rounded">
              <QrCode size={18} weight="thin" />
            </div>
            <div className="grid gap-0.5">
              <span className="text-sm font-semibold text-kumo-strong">
                PromptPay merchant account
              </span>
              <span className="text-xs text-kumo-subtle">
                Recipient account used for EMVCo QR code payload generation
              </span>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditingConfig(!isEditingConfig)}
            className="text-xs"
          >
            <span className="h-lh flex items-center gap-1">
              <PencilSimple size={12} weight="thin" />
              <span>{isEditingConfig ? 'Cancel' : 'Edit gateway'}</span>
            </span>
          </Button>
        </div>

        {isEditingConfig ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-kumo-default">
                PromptPay phone or Tax ID (10/13 digits)
              </label>
              <Input
                value={promptPayTarget}
                onChange={(e) => setPromptPayTarget(e.target.value)}
                placeholder="e.g. 0812345678 or 0105551234567"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-kumo-default">
                Display merchant name
              </label>
              <Input
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                placeholder="e.g. TCprinter Kiosk #1"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditingConfig(false)}
                disabled={isSavingConfig}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveConfig}
                disabled={isSavingConfig}
              >
                {isSavingConfig ? 'Saving...' : 'Save settings'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-xs">
            <div className="p-3 bg-kumo-canvas rounded-md border border-kumo-line">
              <span className="text-kumo-subtle block">Target recipient</span>
              <span className="font-mono text-sm font-semibold text-kumo-strong mt-1 block">
                {promptPayTarget}
              </span>
            </div>
            <div className="p-3 bg-kumo-canvas rounded-md border border-kumo-line">
              <span className="text-kumo-subtle block">Merchant label</span>
              <span className="text-sm font-semibold text-kumo-strong mt-1 block">
                {merchantName}
              </span>
            </div>
            <div className="p-3 bg-kumo-canvas rounded-md border border-kumo-line">
              <span className="text-kumo-subtle block">Validation model</span>
              <span className="text-sm font-semibold text-kumo-strong mt-1 block flex items-center gap-1">
                <ShieldCheck size={14} weight="thin" className="text-emerald-600" />
                <span>Dynamic Satang (0.01 - 0.99 THB)</span>
              </span>
            </div>
          </div>
        )}
      </LayerCard>

      {/* Transaction History Section */}
      <LayerCard className="p-0 overflow-hidden">
        <div className="p-4 border-b border-kumo-line bg-kumo-canvas flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-kumo-strong">
              Transaction logs ({logs.length})
            </span>
            <div className="flex items-center gap-1">
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="text-xs bg-kumo-control border border-kumo-line rounded px-2 py-1 text-kumo-default"
              >
                <option value="ALL">All methods</option>
                <option value="NOTIFICATION_WEBHOOK">Mobile webhook</option>
                <option value="OCR_SLIP">OCR Slip</option>
                <option value="MANUAL_ADMIN">Admin override</option>
              </select>

              <select
                value={matchedFilter}
                onChange={(e) => setMatchedFilter(e.target.value)}
                className="text-xs bg-kumo-control border border-kumo-line rounded px-2 py-1 text-kumo-default"
              >
                <option value="ALL">All status</option>
                <option value="true">Matched</option>
                <option value="false">Unmatched</option>
              </select>
            </div>
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
              <span>Refresh logs</span>
            </span>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-kumo-default">
            <thead className="bg-kumo-recessed/50 text-xs text-kumo-subtle uppercase border-b border-kumo-line">
              <tr>
                <th className="px-5 py-3 font-medium">Timestamp</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Bank / Source</th>
                <th className="px-5 py-3 font-medium">Amount received</th>
                <th className="px-5 py-3 font-medium">Matched order</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kumo-line">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-xs text-kumo-subtle">
                    {isLoading ? 'Loading transaction logs...' : 'No payment records found'}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-kumo-tint">
                    <td className="px-5 py-3 text-xs text-kumo-subtle font-mono text-[0.9em]">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="neutral">
                        {log.method === 'NOTIFICATION_WEBHOOK'
                          ? 'Bank notification'
                          : log.method === 'OCR_SLIP'
                          ? 'Slip OCR'
                          : 'Manual admin'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-xs font-medium text-kumo-strong">
                      {log.bankName || 'Direct transfer'}
                    </td>
                    <td className="px-5 py-3 font-semibold text-xs text-kumo-strong">
                      {formatCurrency(log.amountReceived)}
                    </td>
                    <td className="px-5 py-3 text-xs">
                      {log.job ? (
                        <div className="grid gap-0.5">
                          <span className="font-mono text-kumo-brand font-medium">
                            {log.job.orderCode}
                          </span>
                          <span className="text-[11px] text-kumo-subtle truncate max-w-[140px]">
                            {log.job.originalFileName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-kumo-subtle italic">Unlinked payment</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={log.isMatched ? 'success' : 'critical'}>
                        {log.isMatched ? 'Matched' : 'Unmatched'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {log.jobId && log.job?.status === 'PENDING_PAYMENT' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleApproveJob(log.jobId!)}
                          className="text-xs text-emerald-600"
                        >
                          Approve
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </LayerCard>
    </div>
  );
}
