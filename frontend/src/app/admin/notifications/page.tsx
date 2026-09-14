'use client';

import React, { useEffect, useState } from 'react';
import {
  BellSimpleRinging,
  Copy,
  Check,
  Play,
  ArrowClockwise,
  CheckCircle,
  WarningCircle,
  Eye,
} from '@phosphor-icons/react';
import {
  getNotificationLogs,
  testBankWebhookSimulator,
} from '../../../services/adminService';
import { PaymentLogItem, NotificationResponseData } from '../../../types/admin.types';
import { LayerCard } from '../../../components/ui/LayerCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Dialog } from '../../../components/ui/Dialog';
import { formatCurrency, formatDate } from '../../../lib/formatters';

export default function AdminNotificationsPage() {
  const [data, setData] = useState<NotificationResponseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Simulator state
  const [simAmount, setSimAmount] = useState('1.50');
  const [simBank, setSimBank] = useState('KBANK');
  const [simText, setSimText] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  // Raw payload inspector
  const [inspectPayload, setInspectPayload] = useState<string | null>(null);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const res = await getNotificationLogs(1, 50);
      setData(res);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (text: string, type: 'secret' | 'url') => {
    navigator.clipboard.writeText(text);
    if (type === 'secret') {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(simAmount);
    if (isNaN(num) || num <= 0) {
      alert('Enter a valid amount');
      return;
    }

    setIsSimulating(true);
    setSimResult(null);
    try {
      const res = await testBankWebhookSimulator({
        amount: num,
        bank: simBank,
        rawText: simText || `[K PLUS] You received ${num} THB from PROMPTPAY`,
      });
      setSimResult(res);
      loadLogs();
    } catch (err: any) {
      setSimResult({
        success: false,
        message: err?.response?.data?.error || err.message || 'Simulation error',
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const fullWebhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${data?.webhookConfig?.endpointUrl || '/api/v1/payments/webhook'}`
    : 'http://localhost:4000/api/v1/payments/webhook';

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-kumo-line">
        <div className="grid gap-1">
          <h1 className="text-xl font-semibold text-kumo-strong">
            Mobile notification webhooks & simulator
          </h1>
          <p className="text-sm text-kumo-subtle">
            Configure mobile banking notification receiver, inspect incoming bank webhook payloads, and simulate transactions
          </p>
        </div>
      </div>

      {/* Webhook Connection Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LayerCard className="p-4">
          <div className="grid gap-1 pb-3 border-b border-kumo-line">
            <span className="text-xs font-semibold text-kumo-strong">
              Incoming webhook endpoint URL
            </span>
            <span className="text-[11px] text-kumo-subtle">
              Configure this destination in your Android Notification Listener / MacroDroid app
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              readOnly
              value={fullWebhookUrl}
              className="flex-1 text-xs font-mono bg-kumo-canvas border border-kumo-line rounded px-3 py-2 text-kumo-strong select-all"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleCopy(fullWebhookUrl, 'url')}
              className="text-xs shrink-0"
            >
              <span className="h-lh flex items-center gap-1">
                {copiedUrl ? <Check size={12} weight="thin" /> : <Copy size={12} weight="thin" />}
                <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
              </span>
            </Button>
          </div>
        </LayerCard>

        <LayerCard className="p-4">
          <div className="grid gap-1 pb-3 border-b border-kumo-line">
            <span className="text-xs font-semibold text-kumo-strong">
              Webhook authentication secret header
            </span>
            <span className="text-[11px] text-kumo-subtle">
              Pass in HTTP header: <span className="font-mono text-[0.9em]">X-Webhook-Secret</span>
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              readOnly
              value={data?.webhookConfig?.webhookSecret || 'tcp_webhook_secret_key_2026'}
              type="password"
              className="flex-1 text-xs font-mono bg-kumo-canvas border border-kumo-line rounded px-3 py-2 text-kumo-strong select-all"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                handleCopy(
                  data?.webhookConfig?.webhookSecret || 'tcp_webhook_secret_key_2026',
                  'secret'
                )
              }
              className="text-xs shrink-0"
            >
              <span className="h-lh flex items-center gap-1">
                {copiedSecret ? <Check size={12} weight="thin" /> : <Copy size={12} weight="thin" />}
                <span>{copiedSecret ? 'Copied' : 'Copy key'}</span>
              </span>
            </Button>
          </div>
        </LayerCard>
      </div>

      {/* Webhook Simulator Section */}
      <LayerCard className="p-5">
        <div className="flex items-center gap-2 pb-3 border-b border-kumo-line">
          <div className="p-1.5 bg-orange-50 text-kumo-brand rounded">
            <Play size={16} weight="thin" />
          </div>
          <div className="grid gap-0.5">
            <span className="text-sm font-semibold text-kumo-strong">
              Bank notification webhook simulator
            </span>
            <span className="text-xs text-kumo-subtle">
              Inject a simulated mobile bank notification to test matching against pending customer orders
            </span>
          </div>
        </div>

        <form onSubmit={handleRunSimulation} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4">
          <div className="grid gap-1">
            <label className="text-xs font-medium text-kumo-default">
              Amount (THB)
            </label>
            <Input
              type="number"
              step="0.01"
              value={simAmount}
              onChange={(e) => setSimAmount(e.target.value)}
              placeholder="e.g. 2.47"
              required
            />
          </div>

          <div className="grid gap-1">
            <label className="text-xs font-medium text-kumo-default">
              Sender bank
            </label>
            <select
              value={simBank}
              onChange={(e) => setSimBank(e.target.value)}
              className="w-full text-xs bg-kumo-control border border-kumo-line rounded-md px-3 py-2 text-kumo-default focus:outline-none focus:ring-1 focus:ring-kumo-brand"
            >
              <option value="KBANK">KBank (K PLUS)</option>
              <option value="SCB">SCB (SCB EASY)</option>
              <option value="BBL">Bangkok Bank</option>
              <option value="KTB">Krungthai NEXT</option>
              <option value="TTB">ttb touch</option>
              <option value="BAY">KMA Krungsri</option>
            </select>
          </div>

          <div className="sm:col-span-2 grid gap-1">
            <label className="text-xs font-medium text-kumo-default">
              Notification raw body text (optional)
            </label>
            <Input
              value={simText}
              onChange={(e) => setSimText(e.target.value)}
              placeholder="e.g. Received 2.47 THB from K PLUS PromptPay"
            />
          </div>

          <div className="sm:col-span-4 flex items-center justify-between pt-1">
            <span className="text-[11px] text-kumo-subtle">
              If an active job matches this exact amount with dynamic satang, it will be automatically dispatched!
            </span>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSimulating}
              className="text-xs shrink-0"
            >
              {isSimulating ? 'Sending webhook...' : 'Simulate incoming bank transfer'}
            </Button>
          </div>
        </form>

        {simResult && (
          <div
            className={`mt-4 p-3 rounded-md border text-xs flex items-center gap-2 ${
              simResult.data?.matched
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            {simResult.data?.matched ? (
              <CheckCircle size={16} weight="thin" className="text-emerald-600 shrink-0" />
            ) : (
              <WarningCircle size={16} weight="thin" className="text-amber-600 shrink-0" />
            )}
            <span>{simResult.message}</span>
          </div>
        )}
      </LayerCard>

      {/* Notification Logs Table */}
      <LayerCard className="p-0 overflow-hidden">
        <div className="p-4 border-b border-kumo-line bg-kumo-canvas flex items-center justify-between">
          <div className="grid gap-0.5">
            <span className="text-xs font-semibold text-kumo-strong">
              Bank notification history ({data?.data?.length || 0})
            </span>
            <span className="text-[11px] text-kumo-subtle">
              Raw webhook packets received from mobile listener daemon
            </span>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={loadLogs}
            disabled={isLoading}
            className="text-xs"
          >
            <span className="h-lh flex items-center gap-1">
              <ArrowClockwise
                size={12}
                weight="thin"
                className={isLoading ? 'animate-spin' : ''}
              />
              <span>Refresh</span>
            </span>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-kumo-default">
            <thead className="bg-kumo-recessed/50 text-xs text-kumo-subtle uppercase border-b border-kumo-line">
              <tr>
                <th className="px-5 py-3 font-medium">Timestamp</th>
                <th className="px-5 py-3 font-medium">Bank</th>
                <th className="px-5 py-3 font-medium">Amount received</th>
                <th className="px-5 py-3 font-medium">Matched order</th>
                <th className="px-5 py-3 font-medium">Result</th>
                <th className="px-5 py-3 font-medium text-right">Raw payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kumo-line">
              {(!data?.data || data.data.length === 0) ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-xs text-kumo-subtle">
                    {isLoading ? 'Loading notifications...' : 'No bank webhook events received yet'}
                  </td>
                </tr>
              ) : (
                data.data.map((item) => (
                  <tr key={item.id} className="hover:bg-kumo-tint">
                    <td className="px-5 py-3 text-xs text-kumo-subtle font-mono text-[0.9em]">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-5 py-3 text-xs font-medium text-kumo-strong">
                      {item.bankName || 'Unknown Bank'}
                    </td>
                    <td className="px-5 py-3 font-semibold text-xs text-kumo-strong">
                      {formatCurrency(item.amountReceived)}
                    </td>
                    <td className="px-5 py-3 text-xs">
                      {item.job ? (
                        <span className="font-mono text-kumo-brand font-medium">
                          {item.job.orderCode}
                        </span>
                      ) : (
                        <span className="text-kumo-subtle italic">No order matched</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={item.isMatched ? 'success' : 'critical'}>
                        {item.isMatched ? 'Matched' : 'Unmatched'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {item.rawPayload && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setInspectPayload(item.rawPayload!)}
                          className="text-xs"
                        >
                          <span className="h-lh flex items-center gap-1">
                            <Eye size={12} weight="thin" />
                            <span>Inspect</span>
                          </span>
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

      {/* Raw Payload Inspection Modal */}
      <Dialog
        open={!!inspectPayload}
        onClose={() => setInspectPayload(null)}
        title="Raw webhook JSON payload"
        description="Exact payload received from mobile banking push notification service."
      >
        <div className="grid gap-3 mt-2">
          <pre className="p-3 bg-kumo-recessed rounded-md border border-kumo-line text-xs font-mono text-kumo-default max-h-72 overflow-y-auto whitespace-pre-wrap break-all">
            {(() => {
              if (!inspectPayload) return '';
              try {
                return JSON.stringify(JSON.parse(inspectPayload), null, 2);
              } catch {
                return inspectPayload;
              }
            })()}
          </pre>
          <div className="flex justify-end pt-2 border-t border-kumo-line">
            <Button variant="secondary" size="sm" onClick={() => setInspectPayload(null)}>
              Close
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
