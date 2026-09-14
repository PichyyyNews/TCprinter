'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  GearSix,
  Plus,
  PencilSimple,
  Trash,
  ArrowClockwise,
  CheckCircle,
  HardDrives,
  CreditCard,
  DeviceMobile,
  Printer,
  Copy,
  Check,
  Eye,
  EyeSlash,
  Cpu,
  Warning,
} from '@phosphor-icons/react';
import {
  getSystemConfigs,
  upsertSystemConfig,
  deleteSystemConfig,
  discoverPrinters,
  getAgentStatus,
  setAgentMode,
} from '../../../services/adminService';
import { SystemConfigItem, EnvironmentSummary, DiscoveredPrinter, AgentStatusInfo } from '../../../types/admin.types';
import { LayerCard } from '../../../components/ui/LayerCard';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ConfigModal } from '../../../components/admin/ConfigModal';
import { formatDate } from '../../../lib/formatters';

// ─── Helper: Single field save ───────────────────────────────────────────────
function useSaveField(onSuccess: (msg: string) => void, onError: (msg: string) => void) {
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const save = useCallback(async (key: string, value: string, description?: string) => {
    setSaving((s) => ({ ...s, [key]: true }));
    try {
      await upsertSystemConfig({ key, value, description });
      onSuccess(`Saved: ${key}`);
    } catch {
      onError(`Failed to save ${key}`);
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  }, [onSuccess, onError]);

  return { save, saving };
}

// ─── Card: PromptPay & Payment ────────────────────────────────────────────────
function PromptPayCard({
  configs,
  environment,
  onSave,
  saving,
}: {
  configs: SystemConfigItem[];
  environment: EnvironmentSummary | null;
  onSave: (key: string, value: string, desc?: string) => void;
  saving: Record<string, boolean>;
}) {
  const getVal = (key: string, envFallback?: string) =>
    configs.find((c) => c.key === key)?.value ?? envFallback ?? '';

  const [promptpay, setPromptpay] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  useEffect(() => {
    setPromptpay(getVal('promptpay_target', environment?.PROMPTPAY_TARGET));
    setWebhookSecret(getVal('webhook_secret', environment?.WEBHOOK_SECRET_MASKED));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configs, environment]);

  const handleCopySecret = async () => {
    await navigator.clipboard.writeText(webhookSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return (
    <LayerCard className="p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-kumo-line flex items-center gap-2.5">
        <div className="p-1.5 bg-green-50 text-green-700 rounded border border-green-200">
          <CreditCard size={16} weight="thin" />
        </div>
        <div className="grid gap-0.5">
          <span className="text-sm font-semibold text-kumo-strong">PromptPay & payment gateway</span>
          <span className="text-xs text-kumo-subtle">เบอร์พร้อมเพย์ที่แสดงบน QR Code และ Webhook Secret สำหรับมือถือ</span>
        </div>
      </div>

      <div className="p-5 grid gap-5">
        {/* PromptPay target */}
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-kumo-default">
            เบอร์โทรศัพท์ / เลขบัตรประชาชน (PromptPay)
          </label>
          <div className="flex gap-2">
            <Input
              value={promptpay}
              onChange={(e) => setPromptpay(e.target.value)}
              placeholder="เช่น 0812345678 หรือ 1234567890123"
              className="flex-1 font-mono text-xs"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={() => onSave('promptpay_target', promptpay, 'PromptPay phone number or tax ID for QR code generation')}
              disabled={saving['promptpay_target'] || !promptpay.trim()}
            >
              {saving['promptpay_target'] ? 'Saving…' : 'Save'}
            </Button>
          </div>
          <p className="text-[11px] text-kumo-subtle">
            บันทึกแล้ว QR Code ที่หน้า Kiosk จะเปลี่ยนทันที ไม่ต้อง restart
          </p>
        </div>

        {/* Webhook Secret */}
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-kumo-default">Webhook Secret Key</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showSecret ? 'text' : 'password'}
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder="Secret key สำหรับ MacroDroid"
                className="flex-1 font-mono text-xs pr-8"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-kumo-subtle hover:text-kumo-default"
              >
                {showSecret ? <EyeSlash size={14} weight="thin" /> : <Eye size={14} weight="thin" />}
              </button>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopySecret}
            >
              <span className="h-lh flex items-center gap-1">
                {copiedSecret ? <Check size={12} weight="thin" /> : <Copy size={12} weight="thin" />}
                <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
              </span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onSave('webhook_secret', webhookSecret, 'Webhook secret key for bank notification validation')}
              disabled={saving['webhook_secret'] || !webhookSecret.trim()}
            >
              {saving['webhook_secret'] ? 'Saving…' : 'Save'}
            </Button>
          </div>
          <p className="text-[11px] text-kumo-subtle">
            ใส่ค่านี้ใน Header{' '}
            <code className="font-mono bg-kumo-recessed px-1 rounded">X-Webhook-Secret</code>{' '}
            ของ MacroDroid — บันทึกแล้วมีผลทันที ไม่ต้อง restart
          </p>
        </div>
      </div>
    </LayerCard>
  );
}

// ─── Card: MacroDroid Setup Guide ────────────────────────────────────────────
function MacroDroidGuideCard({
  configs,
  environment,
}: {
  configs: SystemConfigItem[];
  environment: EnvironmentSummary | null;
}) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  const secret =
    configs.find((c) => c.key === 'webhook_secret')?.value ??
    environment?.WEBHOOK_SECRET_MASKED ??
    'your-webhook-secret';

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:4000/api/v1/payments/webhook`
      : 'http://[IP-ตู้]:4000/api/v1/payments/webhook';

  const bodyTemplate = JSON.stringify(
    {
      bank: '[not_app_name]',
      rawText: '[not_body]',
      title: '[not_title]',
      timestamp: '[year]-[month_digit]-[day_digit]T[hour]:[minute]:00+07:00',
    },
    null,
    2
  );

  const copyText = async (text: string, type: 'url' | 'body') => {
    await navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2000);
    }
  };

  return (
    <LayerCard className="p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-kumo-line flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
          <DeviceMobile size={16} weight="thin" />
        </div>
        <div className="grid gap-0.5">
          <span className="text-sm font-semibold text-kumo-strong">MacroDroid setup guide</span>
          <span className="text-xs text-kumo-subtle">ข้อมูลสำหรับตั้งค่าแอป MacroDroid บน Android เพื่อดักเงินเข้าอัตโนมัติ</span>
        </div>
      </div>

      <div className="p-5 grid gap-4">
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-kumo-default">Webhook URL (ใส่ใน MacroDroid → HTTP Request → URL)</label>
            <button
              onClick={() => copyText(webhookUrl, 'url')}
              className="flex items-center gap-1 text-[11px] text-kumo-subtle hover:text-kumo-brand"
            >
              {copiedUrl ? <Check size={12} weight="thin" /> : <Copy size={12} weight="thin" />}
              <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <code className="block text-[11px] font-mono bg-kumo-recessed border border-kumo-line rounded px-3 py-2 text-kumo-strong break-all">
            {webhookUrl}
          </code>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="grid gap-1">
            <span className="font-medium text-kumo-default">Header 1</span>
            <code className="font-mono bg-kumo-recessed border border-kumo-line rounded px-2 py-1.5 text-[11px] text-kumo-strong">
              Content-Type: application/json
            </code>
          </div>
          <div className="grid gap-1">
            <span className="font-medium text-kumo-default">Header 2</span>
            <code className="font-mono bg-kumo-recessed border border-kumo-line rounded px-2 py-1.5 text-[11px] text-kumo-strong break-all">
              X-Webhook-Secret: {secret}
            </code>
          </div>
        </div>

        <div className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-kumo-default">Body (JSON — paste ใน MacroDroid → Body Content)</label>
            <button
              onClick={() => copyText(bodyTemplate, 'body')}
              className="flex items-center gap-1 text-[11px] text-kumo-subtle hover:text-kumo-brand"
            >
              {copiedBody ? <Check size={12} weight="thin" /> : <Copy size={12} weight="thin" />}
              <span>{copiedBody ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="text-[11px] font-mono bg-kumo-recessed border border-kumo-line rounded px-3 py-2 text-kumo-strong overflow-x-auto">
            {bodyTemplate}
          </pre>
        </div>
      </div>
    </LayerCard>
  );
}

// ─── Card: Print Agent Config ─────────────────────────────────────────────────
function PrintAgentCard({
  configs,
  onSave,
  saving,
}: {
  configs: SystemConfigItem[];
  onSave: (key: string, value: string, desc?: string) => void;
  saving: Record<string, boolean>;
}) {
  const getVal = (key: string, fallback = '') =>
    configs.find((c) => c.key === key)?.value ?? fallback;

  const [agentStatus, setAgentStatus] = useState<AgentStatusInfo | null>(null);
  const [discoveredPrinters, setDiscoveredPrinters] = useState<DiscoveredPrinter[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [printerName, setPrinterName] = useState('');
  const [sumatraPath, setSumatraPath] = useState('');
  const [isSwitchingMode, setIsSwitchingMode] = useState(false);

  useEffect(() => {
    setPrinterName(getVal('agent_printer_name', 'Canon G2010 series'));
    setSumatraPath(getVal('agent_sumatra_path', 'C:\\Program Files\\SumatraPDF\\SumatraPDF.exe'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configs]);

  useEffect(() => {
    getAgentStatus().then(setAgentStatus).catch(() => {});
  }, []);

  const handleDiscover = async () => {
    setIsDiscovering(true);
    try {
      const result = await discoverPrinters();
      setDiscoveredPrinters(result);
    } catch {
      // ignore
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleToggleMode = async () => {
    if (!agentStatus) return;
    const newMode = agentStatus.driverMode === 'SUMATRA' ? 'SIMULATION' : 'SUMATRA';
    setIsSwitchingMode(true);
    try {
      await setAgentMode(newMode);
      setAgentStatus((s) => s ? { ...s, driverMode: newMode } : s);
    } catch {
      // ignore
    } finally {
      setIsSwitchingMode(false);
    }
  };

  const isSimulation = agentStatus?.driverMode !== 'SUMATRA';

  return (
    <LayerCard className="p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-kumo-line flex items-center gap-2.5">
        <div className="p-1.5 bg-purple-50 text-purple-700 rounded border border-purple-200">
          <Cpu size={16} weight="thin" />
        </div>
        <div className="grid gap-0.5 flex-1 min-w-0">
          <span className="text-sm font-semibold text-kumo-strong">Print agent & hardware</span>
          <span className="text-xs text-kumo-subtle">ตั้งค่าเครื่องพิมพ์และโหมด driver สำหรับ Print Agent</span>
        </div>
        {agentStatus && (
          <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded border ${
            agentStatus.isConnected
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${agentStatus.isConnected ? 'bg-green-500' : 'bg-amber-500'}`} />
            <span>{agentStatus.isConnected ? 'Online' : 'Offline'}</span>
          </div>
        )}
      </div>

      <div className="p-5 grid gap-5">
        {/* Driver Mode Toggle */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-kumo-hairline">
          <div className="grid gap-1">
            <span className="text-xs font-semibold text-kumo-strong">Driver mode</span>
            <span className="text-[11px] text-kumo-subtle">
              {isSimulation
                ? 'Simulation — จำลองการพิมพ์ ไม่สั่งพิมพ์จริง เหมาะสำหรับทดสอบ'
                : 'SumatraPDF — สั่งพิมพ์จริงผ่าน SumatraPDF CLI ไปยังเครื่องพิมพ์'}
            </span>
          </div>
          <button
            onClick={handleToggleMode}
            disabled={isSwitchingMode || !agentStatus?.isConnected}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
              !isSimulation ? 'bg-kumo-brand' : 'bg-kumo-line'
            }`}
            title={agentStatus?.isConnected ? undefined : 'Print Agent ต้องออนไลน์ก่อน'}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                !isSimulation ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Printer name */}
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-kumo-default">ชื่อ Printer (ตรงกับที่อยู่ใน Windows)</label>
          <div className="flex gap-2">
            {discoveredPrinters.length > 0 ? (
              <select
                value={printerName}
                onChange={(e) => setPrinterName(e.target.value)}
                className="flex-1 h-8 px-3 text-xs font-mono bg-kumo-control border border-kumo-line rounded-md text-kumo-default focus:outline-none focus:ring-1 focus:ring-kumo-brand"
              >
                {discoveredPrinters.map((p) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            ) : (
              <Input
                value={printerName}
                onChange={(e) => setPrinterName(e.target.value)}
                placeholder="เช่น Canon G2010 series"
                className="flex-1 font-mono text-xs"
              />
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDiscover}
              isLoading={isDiscovering}
            >
              <span className="h-lh flex items-center gap-1">
                <Printer size={12} weight="thin" />
                <span>Discover</span>
              </span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onSave('agent_printer_name', printerName, 'Active printer name for print agent')}
              disabled={saving['agent_printer_name'] || !printerName.trim()}
            >
              {saving['agent_printer_name'] ? 'Saving…' : 'Save'}
            </Button>
          </div>
          {!agentStatus?.isConnected && (
            <p className="text-[11px] text-amber-600 flex items-center gap-1">
              <Warning size={12} weight="thin" />
              <span>บันทึกได้ แต่จะมีผลตอน Print Agent เชื่อมต่อใหม่ครั้งหน้า</span>
            </p>
          )}
        </div>

        {/* SumatraPDF path */}
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-kumo-default">SumatraPDF executable path</label>
          <div className="flex gap-2">
            <Input
              value={sumatraPath}
              onChange={(e) => setSumatraPath(e.target.value)}
              placeholder="C:\Program Files\SumatraPDF\SumatraPDF.exe"
              className="flex-1 font-mono text-xs"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={() => onSave('agent_sumatra_path', sumatraPath, 'Path to SumatraPDF.exe for silent print')}
              disabled={saving['agent_sumatra_path'] || !sumatraPath.trim()}
            >
              {saving['agent_sumatra_path'] ? 'Saving…' : 'Save'}
            </Button>
          </div>
          <p className="text-[11px] text-kumo-subtle">
            ดาวน์โหลดฟรีที่{' '}
            <a
              href="https://www.sumatrapdfreader.org/download-free-pdf-viewer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-kumo-brand hover:underline"
            >
              sumatrapdfreader.org
            </a>
            {' '}— ใส่ค่า path ที่ถูกต้องแล้วกด Save (Print Agent จะอัปเดตทันทีถ้าออนไลน์)
          </p>
        </div>
      </div>
    </LayerCard>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminSettingsPage() {
  const [configs, setConfigs] = useState<SystemConfigItem[]>([]);
  const [environment, setEnvironment] = useState<EnvironmentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConfig, setSelectedConfig] = useState<SystemConfigItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showFeedback = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 4000);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getSystemConfigs();
      setConfigs(data.configs);
      setEnvironment(data.environment);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const { save, saving } = useSaveField(
    (msg) => {
      showFeedback(msg, 'success');
      loadData();
    },
    (msg) => showFeedback(msg, 'error')
  );

  const handleAdd = () => {
    setSelectedConfig(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: SystemConfigItem) => {
    setSelectedConfig(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`Are you sure you want to delete config key "${key}"?`)) return;
    try {
      await deleteSystemConfig(key);
      setConfigs((prev) => prev.filter((c) => c.key !== key));
      showFeedback(`Configuration '${key}' deleted`);
    } catch (e: any) {
      showFeedback(e?.response?.data?.error || 'Failed to delete config', 'error');
    }
  };

  const handleSave = async (payload: { key: string; value: string; description?: string }) => {
    const updated = await upsertSystemConfig(payload);
    setConfigs((prev) => {
      const exists = prev.some((c) => c.key === updated.key);
      return exists
        ? prev.map((c) => (c.key === updated.key ? updated : c))
        : [...prev, updated];
    });
    showFeedback(`Configuration '${updated.key}' saved successfully`);
  };

  // Keys managed by the Setup Wizard cards above (hide from raw table)
  const WIZARD_KEYS = new Set(['promptpay_target', 'webhook_secret', 'agent_printer_name', 'agent_sumatra_path']);
  const rawConfigs = configs.filter((c) => !WIZARD_KEYS.has(c.key));

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-kumo-line">
        <div className="grid gap-1">
          <h1 className="text-xl font-semibold text-kumo-strong">System settings & configuration</h1>
          <p className="text-sm text-kumo-subtle">
            ตั้งค่าระบบชำระเงิน, เครื่องพิมพ์, และ Print Agent ได้จากหน้านี้ ไม่ต้องแก้ไฟล์ .env
          </p>
        </div>
      </div>

      {/* Feedback toast */}
      {feedback && (
        <div
          className={`p-3 rounded-md text-xs flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <CheckCircle size={16} weight="thin" className={feedback.type === 'success' ? 'text-emerald-600' : 'text-red-600'} />
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* === SETUP WIZARD CARDS === */}
      <div className="grid gap-4">
        <h2 className="text-sm font-semibold text-kumo-strong">Quick setup</h2>

        <PromptPayCard
          configs={configs}
          environment={environment}
          onSave={save}
          saving={saving}
        />

        <MacroDroidGuideCard
          configs={configs}
          environment={environment}
        />

        <PrintAgentCard
          configs={configs}
          onSave={save}
          saving={saving}
        />
      </div>

      {/* === ENVIRONMENT SUMMARY === */}
      {environment && (
        <LayerCard className="p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-kumo-line">
            <div className="p-1.5 bg-kumo-recessed text-kumo-strong rounded border border-kumo-line">
              <HardDrives size={16} weight="thin" />
            </div>
            <div className="grid gap-0.5">
              <span className="text-sm font-semibold text-kumo-strong">Runtime environment (.env)</span>
              <span className="text-xs text-kumo-subtle">ค่าคงที่จาก .env ที่ต้อง restart server เพื่อเปลี่ยน</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
            <div className="p-2.5 bg-kumo-canvas rounded border border-kumo-line">
              <span className="text-kumo-subtle block">Backend port</span>
              <span className="font-mono text-sm font-semibold text-kumo-strong mt-0.5 block">{environment.PORT}</span>
            </div>
            <div className="p-2.5 bg-kumo-canvas rounded border border-kumo-line">
              <span className="text-kumo-subtle block">Environment</span>
              <span className="font-mono text-sm font-semibold text-kumo-strong mt-0.5 block">{environment.NODE_ENV}</span>
            </div>
            <div className="p-2.5 bg-kumo-canvas rounded border border-kumo-line">
              <span className="text-kumo-subtle block">Order timeout TTL</span>
              <span className="font-mono text-sm font-semibold text-kumo-strong mt-0.5 block">{environment.ORDER_TIMEOUT_SECONDS}s</span>
            </div>
            <div className="p-2.5 bg-kumo-canvas rounded border border-kumo-line">
              <span className="text-kumo-subtle block">Webhook tolerance</span>
              <span className="font-mono text-sm font-semibold text-kumo-strong mt-0.5 block">{environment.WEBHOOK_TOLERANCE_MINUTES} min</span>
            </div>
            <div className="p-2.5 bg-kumo-canvas rounded border border-kumo-line sm:col-span-2">
              <span className="text-kumo-subtle block">Webhook secret (.env fallback)</span>
              <span className="font-mono text-xs text-kumo-strong mt-0.5 block">{environment.WEBHOOK_SECRET_MASKED}</span>
            </div>
            <div className="p-2.5 bg-kumo-canvas rounded border border-kumo-line sm:col-span-2">
              <span className="text-kumo-subtle block">Agent token</span>
              <span className="font-mono text-xs text-kumo-strong mt-0.5 block">{environment.AGENT_TOKEN_MASKED}</span>
            </div>
          </div>
        </LayerCard>
      )}

      {/* === RAW KEY-VALUE TABLE (ค่าอื่นๆ นอกจาก Wizard keys) === */}
      <LayerCard className="p-0 overflow-hidden">
        <div className="p-4 border-b border-kumo-line bg-kumo-canvas flex items-center justify-between">
          <div className="grid gap-0.5">
            <span className="text-xs font-semibold text-kumo-strong">
              Advanced database config ({rawConfigs.length})
            </span>
            <span className="text-[11px] text-kumo-subtle">
              ค่าพิเศษอื่นๆ ที่ตั้งเพิ่มเติมได้ — อัปเดตได้โดยไม่ต้อง restart
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={loadData} disabled={isLoading} className="text-xs">
              <span className="h-lh flex items-center gap-1">
                <ArrowClockwise size={12} weight="thin" className={isLoading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </span>
            </Button>
            <Button variant="primary" size="sm" onClick={handleAdd} className="text-xs">
              <span className="h-lh flex items-center gap-1.5">
                <Plus size={14} weight="thin" />
                <span>Add</span>
              </span>
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-kumo-default">
            <thead className="bg-kumo-recessed/50 text-xs text-kumo-subtle uppercase border-b border-kumo-line">
              <tr>
                <th className="px-5 py-3 font-medium">Config key</th>
                <th className="px-5 py-3 font-medium">Value</th>
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 font-medium">Last modified</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kumo-line">
              {rawConfigs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-xs text-kumo-subtle">
                    {isLoading ? 'Loading configs…' : 'No additional configs. Use Quick setup above for main settings.'}
                  </td>
                </tr>
              ) : (
                rawConfigs.map((cfg) => (
                  <tr key={cfg.key} className="hover:bg-kumo-tint">
                    <td className="px-5 py-3 font-mono text-xs font-medium text-kumo-strong">{cfg.key}</td>
                    <td className="px-5 py-3 font-mono text-xs text-kumo-brand">{cfg.value}</td>
                    <td className="px-5 py-3 text-xs text-kumo-subtle max-w-xs truncate">{cfg.description || '—'}</td>
                    <td className="px-5 py-3 text-xs text-kumo-subtle font-mono text-[0.9em]">{formatDate(cfg.updatedAt)}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="secondary" size="sm" onClick={() => handleEdit(cfg)} className="text-xs">
                          <span className="h-lh flex items-center gap-1">
                            <PencilSimple size={12} weight="thin" />
                            <span>Edit</span>
                          </span>
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(cfg.key)} className="text-xs">
                          <span className="h-lh flex items-center">
                            <Trash size={12} weight="thin" />
                          </span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </LayerCard>

      <ConfigModal
        config={selectedConfig}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
