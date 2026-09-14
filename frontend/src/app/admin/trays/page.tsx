'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, PencilSimple } from '@phosphor-icons/react';
import { getTrays, getPricingRules } from '../../../services/adminService';
import { AdminTray, PricingRuleItem } from '../../../types/admin.types';
import { LayerCard } from '../../../components/ui/LayerCard';
import { TrayControlCard } from '../../../components/admin/TrayControlCard';
import { PricingEditModal } from '../../../components/admin/PricingEditModal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { formatCurrency } from '../../../lib/formatters';

export default function AdminTraysPage() {
  const [trays, setTrays] = useState<AdminTray[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRuleItem[]>([]);
  const [selectedRule, setSelectedRule] = useState<PricingRuleItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    try {
      const [traysData, rulesData] = await Promise.all([
        getTrays().catch(() => []),
        getPricingRules().catch(() => []),
      ]);
      setTrays(traysData);
      setPricingRules(rulesData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTrayUpdated = (updated: AdminTray) => {
    setTrays((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleEditRule = (rule: PricingRuleItem) => {
    setSelectedRule(rule);
    setIsModalOpen(true);
  };

  const handleRuleSaved = (saved: PricingRuleItem) => {
    setPricingRules((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
  };

  return (
    <div className="grid gap-8 py-2">
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
            Paper tray mapping & pricing rules
          </h1>
          <p className="text-sm text-kumo-subtle">
            Manage physical printer paper cassettes and rate cards
          </p>
        </div>
      </div>

      {/* Trays List */}
      <div className="grid gap-3">
        <h2 className="text-base font-semibold text-kumo-strong">
          Active printer trays
        </h2>
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

      {/* Pricing Rules Section */}
      <div className="grid gap-3 pt-4 border-t border-kumo-line">
        <h2 className="text-base font-semibold text-kumo-strong">
          Service pricing matrix
        </h2>
        <LayerCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-kumo-default">
              <thead className="bg-kumo-recessed/50 text-xs text-kumo-subtle uppercase border-b border-kumo-line">
                <tr>
                  <th className="px-5 py-3 font-medium">Paper size</th>
                  <th className="px-5 py-3 font-medium">Color mode</th>
                  <th className="px-5 py-3 font-medium">Duplex</th>
                  <th className="px-5 py-3 font-medium">Price per sheet</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kumo-line">
                {pricingRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-kumo-tint">
                    <td className="px-5 py-3 font-medium">{rule.paperSize}</td>
                    <td className="px-5 py-3">
                      <Badge variant={rule.isColor ? 'brand' : 'neutral'}>
                        {rule.isColor ? 'Color' : 'Monochrome'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-xs text-kumo-subtle">
                      {rule.isDuplex ? 'Double-sided' : 'Single-sided'}
                    </td>
                    <td className="px-5 py-3 font-semibold">
                      {formatCurrency(rule.pricePerPage)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEditRule(rule)}
                        className="text-xs"
                      >
                        <span className="h-lh flex items-center gap-1">
                          <PencilSimple size={12} weight="thin" />
                          <span>Edit rate</span>
                        </span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </LayerCard>
      </div>

      {/* Rule Edit Modal */}
      <PricingEditModal
        rule={selectedRule}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={handleRuleSaved}
      />
    </div>
  );
}
