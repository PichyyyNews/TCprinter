'use client';

import React, { useEffect, useState } from 'react';
import {
  GearSix,
  Plus,
  PencilSimple,
  Trash,
  ArrowClockwise,
  CheckCircle,
  ShieldCheck,
  HardDrives,
} from '@phosphor-icons/react';
import {
  getSystemConfigs,
  upsertSystemConfig,
  deleteSystemConfig,
} from '../../../services/adminService';
import { SystemConfigItem, EnvironmentSummary } from '../../../types/admin.types';
import { LayerCard } from '../../../components/ui/LayerCard';
import { Button } from '../../../components/ui/Button';
import { ConfigModal } from '../../../components/admin/ConfigModal';
import { formatDate } from '../../../lib/formatters';

export default function AdminSettingsPage() {
  const [configs, setConfigs] = useState<SystemConfigItem[]>([]);
  const [environment, setEnvironment] = useState<EnvironmentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConfig, setSelectedConfig] = useState<SystemConfigItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

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

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

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
      alert(e?.response?.data?.error || 'Failed to delete config');
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

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-kumo-line">
        <div className="grid gap-1">
          <h1 className="text-xl font-semibold text-kumo-strong">
            System configuration & environment parameters
          </h1>
          <p className="text-sm text-kumo-subtle">
            Manage dynamic application settings, timeouts, operational thresholds, and system environment
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleAdd}
          className="text-xs"
        >
          <span className="h-lh flex items-center gap-1.5">
            <Plus size={14} weight="thin" />
            <span>Add setting</span>
          </span>
        </Button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs flex items-center gap-2">
          <CheckCircle size={16} weight="thin" className="text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Environment Summary Card */}
      {environment && (
        <LayerCard className="p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-kumo-line">
            <div className="p-1.5 bg-kumo-recessed text-kumo-strong rounded border border-kumo-line">
              <HardDrives size={16} weight="thin" />
            </div>
            <div className="grid gap-0.5">
              <span className="text-sm font-semibold text-kumo-strong">
                Runtime environment variables
              </span>
              <span className="text-xs text-kumo-subtle">
                Operating server environment configured at startup
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
            <div className="p-2.5 bg-kumo-canvas rounded border border-kumo-line">
              <span className="text-kumo-subtle block">Backend port</span>
              <span className="font-mono text-sm font-semibold text-kumo-strong mt-0.5 block">
                {environment.PORT}
              </span>
            </div>

            <div className="p-2.5 bg-kumo-canvas rounded border border-kumo-line">
              <span className="text-kumo-subtle block">Environment</span>
              <span className="font-mono text-sm font-semibold text-kumo-strong mt-0.5 block">
                {environment.NODE_ENV}
              </span>
            </div>

            <div className="p-2.5 bg-kumo-canvas rounded border border-kumo-line">
              <span className="text-kumo-subtle block">Order timeout TTL</span>
              <span className="font-mono text-sm font-semibold text-kumo-strong mt-0.5 block">
                {environment.ORDER_TIMEOUT_SECONDS}s (15 min)
              </span>
            </div>

            <div className="p-2.5 bg-kumo-canvas rounded border border-kumo-line">
              <span className="text-kumo-subtle block">Webhook tolerance</span>
              <span className="font-mono text-sm font-semibold text-kumo-strong mt-0.5 block">
                {environment.WEBHOOK_TOLERANCE_MINUTES} min
              </span>
            </div>

            <div className="p-2.5 bg-kumo-canvas rounded border border-kumo-line sm:col-span-2">
              <span className="text-kumo-subtle block">Webhook secret key</span>
              <span className="font-mono text-xs text-kumo-strong mt-0.5 block">
                {environment.WEBHOOK_SECRET_MASKED}
              </span>
            </div>

            <div className="p-2.5 bg-kumo-canvas rounded border border-kumo-line sm:col-span-2">
              <span className="text-kumo-subtle block">Agent connection token</span>
              <span className="font-mono text-xs text-kumo-strong mt-0.5 block">
                {environment.AGENT_TOKEN_MASKED}
              </span>
            </div>
          </div>
        </LayerCard>
      )}

      {/* Dynamic Config Key-Value Table */}
      <LayerCard className="p-0 overflow-hidden">
        <div className="p-4 border-b border-kumo-line bg-kumo-canvas flex items-center justify-between">
          <div className="grid gap-0.5">
            <span className="text-xs font-semibold text-kumo-strong">
              Database system configuration ({configs.length})
            </span>
            <span className="text-[11px] text-kumo-subtle">
              Key-value parameters that can be updated dynamically without restarting the server
            </span>
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
              <span>Refresh</span>
            </span>
          </Button>
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
              {configs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-xs text-kumo-subtle">
                    {isLoading ? 'Loading configs...' : 'No system configs configured'}
                  </td>
                </tr>
              ) : (
                configs.map((cfg) => (
                  <tr key={cfg.key} className="hover:bg-kumo-tint">
                    <td className="px-5 py-3 font-mono text-xs font-medium text-kumo-strong">
                      {cfg.key}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-kumo-brand">
                      {cfg.value}
                    </td>
                    <td className="px-5 py-3 text-xs text-kumo-subtle max-w-xs truncate">
                      {cfg.description || '—'}
                    </td>
                    <td className="px-5 py-3 text-xs text-kumo-subtle font-mono text-[0.9em]">
                      {formatDate(cfg.updatedAt)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEdit(cfg)}
                          className="text-xs"
                        >
                          <span className="h-lh flex items-center gap-1">
                            <PencilSimple size={12} weight="thin" />
                            <span>Edit</span>
                          </span>
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(cfg.key)}
                          className="text-xs"
                        >
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

      {/* Config Modal */}
      <ConfigModal
        config={selectedConfig}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
