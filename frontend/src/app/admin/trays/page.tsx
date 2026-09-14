'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  PencilSimple,
  Plus,
  Trash,
  CheckCircle,
  Tray as TrayIcon,
} from '@phosphor-icons/react';
import {
  getTrays,
  createTray,
  updateTray,
  deleteTray,
  getPricingRules,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
  getPrinters,
} from '../../../services/adminService';
import { AdminTray, PricingRuleItem, AdminPrinter } from '../../../types/admin.types';
import { LayerCard } from '../../../components/ui/LayerCard';
import { TrayControlCard } from '../../../components/admin/TrayControlCard';
import { TrayModal } from '../../../components/admin/TrayModal';
import { PricingRuleModal } from '../../../components/admin/PricingRuleModal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { formatCurrency } from '../../../lib/formatters';

export default function AdminTraysPage() {
  const [trays, setTrays] = useState<AdminTray[]>([]);
  const [printers, setPrinters] = useState<AdminPrinter[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRuleItem[]>([]);
  const [selectedTray, setSelectedTray] = useState<AdminTray | null>(null);
  const [selectedRule, setSelectedRule] = useState<PricingRuleItem | null>(null);
  const [isTrayModalOpen, setIsTrayModalOpen] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [traysData, rulesData, printersData] = await Promise.all([
        getTrays().catch(() => []),
        getPricingRules().catch(() => []),
        getPrinters().catch(() => []),
      ]);
      setTrays(traysData);
      setPricingRules(rulesData);
      setPrinters(printersData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  // Tray handlers
  const handleAddTray = () => {
    setSelectedTray(null);
    setIsTrayModalOpen(true);
  };

  const handleEditTray = (t: AdminTray) => {
    setSelectedTray(t);
    setIsTrayModalOpen(true);
  };

  const handleDeleteTray = async (id: string, trayNum: number) => {
    if (!confirm(`Are you sure you want to delete Tray ${trayNum}?`)) return;
    try {
      await deleteTray(id);
      setTrays((prev) => prev.filter((t) => t.id !== id));
      showFeedback(`Tray ${trayNum} deleted successfully`);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to delete tray');
    }
  };

  const handleSaveTray = async (payload: any) => {
    if (selectedTray) {
      const updated = await updateTray(selectedTray.id, payload);
      setTrays((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      showFeedback(`Tray ${updated.trayNumber} updated successfully`);
    } else {
      const created = await createTray(payload);
      setTrays((prev) => [...prev, created]);
      showFeedback(`Tray ${created.trayNumber} created successfully`);
    }
  };

  // Pricing Rule handlers
  const handleAddRule = () => {
    setSelectedRule(null);
    setIsRuleModalOpen(true);
  };

  const handleEditRule = (rule: PricingRuleItem) => {
    setSelectedRule(rule);
    setIsRuleModalOpen(true);
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pricing rule?')) return;
    try {
      await deletePricingRule(id);
      setPricingRules((prev) => prev.filter((r) => r.id !== id));
      showFeedback('Pricing rule deleted successfully');
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to delete pricing rule');
    }
  };

  const handleSaveRule = async (payload: any) => {
    if (selectedRule) {
      const updated = await updatePricingRule(selectedRule.id, payload.pricePerPage, payload.isActive);
      setPricingRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      showFeedback('Pricing rate updated successfully');
    } else {
      const created = await createPricingRule(payload);
      setPricingRules((prev) => [...prev, created]);
      showFeedback('New pricing rule added successfully');
    }
  };

  return (
    <div className="grid gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-kumo-line">
        <div className="grid gap-1">
          <h1 className="text-xl font-semibold text-kumo-strong">
            Paper tray mapping & pricing rules
          </h1>
          <p className="text-sm text-kumo-subtle">
            Manage physical printer paper cassettes, capacity thresholds, and per-page rate cards
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAddRule}
            className="text-xs"
          >
            <span className="h-lh flex items-center gap-1.5">
              <Plus size={14} weight="thin" />
              <span>Add pricing rate</span>
            </span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleAddTray}
            className="text-xs"
          >
            <span className="h-lh flex items-center gap-1.5">
              <Plus size={14} weight="thin" />
              <span>Add paper tray</span>
            </span>
          </Button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs flex items-center gap-2">
          <CheckCircle size={16} weight="thin" className="text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Trays List Section */}
      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <div className="grid gap-0.5">
            <h2 className="text-base font-semibold text-kumo-strong">
              Configured paper cassettes ({trays.length})
            </h2>
            <p className="text-xs text-kumo-subtle">
              Direct tray toggles, paper reload counters, and physical status
            </p>
          </div>
        </div>

        {trays.length === 0 ? (
          <div className="p-8 text-center bg-kumo-base border border-kumo-line rounded-lg text-xs text-kumo-subtle">
            No paper trays configured yet. Click "Add paper tray" above to assign a cassette to a printer.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trays.map((tray) => (
              <div key={tray.id} className="relative group">
                <TrayControlCard
                  tray={tray}
                  onUpdated={(updated) => {
                    setTrays((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
                  }}
                />
                <div className="mt-2 flex items-center justify-end gap-2 px-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEditTray(tray)}
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
                    onClick={() => handleDeleteTray(tray.id, tray.trayNumber)}
                    className="text-xs"
                  >
                    <span className="h-lh flex items-center">
                      <Trash size={12} weight="thin" />
                    </span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pricing Rules Section */}
      <div className="grid gap-3 pt-4 border-t border-kumo-line">
        <div className="flex items-center justify-between">
          <div className="grid gap-0.5">
            <h2 className="text-base font-semibold text-kumo-strong">
              Service pricing matrix ({pricingRules.length} rules)
            </h2>
            <p className="text-xs text-kumo-subtle">
              Charges applied to customer jobs based on paper attributes
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAddRule}
            className="text-xs"
          >
            <span className="h-lh flex items-center gap-1.5">
              <Plus size={14} weight="thin" />
              <span>Add new rule</span>
            </span>
          </Button>
        </div>

        <LayerCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-kumo-default">
              <thead className="bg-kumo-recessed/50 text-xs text-kumo-subtle uppercase border-b border-kumo-line">
                <tr>
                  <th className="px-5 py-3 font-medium">Paper size</th>
                  <th className="px-5 py-3 font-medium">Color mode</th>
                  <th className="px-5 py-3 font-medium">Duplex</th>
                  <th className="px-5 py-3 font-medium">Price per sheet</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kumo-line">
                {pricingRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-kumo-tint">
                    <td className="px-5 py-3 font-medium text-kumo-strong">{rule.paperSize}</td>
                    <td className="px-5 py-3">
                      <Badge variant={rule.isColor ? 'brand' : 'neutral'}>
                        {rule.isColor ? 'Color' : 'Monochrome'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-xs text-kumo-subtle">
                      {rule.isDuplex ? 'Double-sided' : 'Single-sided'}
                    </td>
                    <td className="px-5 py-3 font-semibold text-kumo-strong">
                      {formatCurrency(rule.pricePerPage)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={rule.isActive ? 'success' : 'neutral'}>
                        {rule.isActive ? 'Active' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEditRule(rule)}
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
                          onClick={() => handleDeleteRule(rule.id)}
                          className="text-xs"
                        >
                          <span className="h-lh flex items-center">
                            <Trash size={12} weight="thin" />
                          </span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </LayerCard>
      </div>

      {/* Tray Modal */}
      <TrayModal
        tray={selectedTray}
        printers={printers}
        open={isTrayModalOpen}
        onClose={() => setIsTrayModalOpen(false)}
        onSave={handleSaveTray}
      />

      {/* Pricing Rule Modal */}
      <PricingRuleModal
        rule={selectedRule}
        open={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        onSave={handleSaveRule}
      />
    </div>
  );
}
