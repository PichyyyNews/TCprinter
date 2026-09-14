'use client';

import React, { useState } from 'react';
import { PricingRuleItem } from '../../types/admin.types';
import { updatePricingRule } from '../../services/adminService';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export interface PricingEditModalProps {
  rule: PricingRuleItem | null;
  open: boolean;
  onClose: () => void;
  onSaved: (saved: PricingRuleItem) => void;
}

export function PricingEditModal({ rule, open, onClose, onSaved }: PricingEditModalProps) {
  const [price, setPrice] = useState<string>(rule ? rule.pricePerPage.toString() : '1.5');
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (rule) {
      setPrice(rule.pricePerPage.toString());
    }
  }, [rule]);

  const handleSave = async () => {
    if (!rule) return;
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) return;

    setIsSaving(true);
    try {
      const updated = await updatePricingRule(rule.id, numPrice);
      onSaved(updated);
      onClose();
    } catch (e) {
      console.error('Failed to update pricing rule:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      title="Edit pricing rule"
      description={
        rule
          ? `${rule.paperSize} • ${rule.isColor ? 'Color' : 'Monochrome'} • ${rule.isDuplex ? 'Duplex' : 'Single-sided'}`
          : 'Update rate per page'
      }
      className="max-w-sm"
    >
      <div className="grid gap-4">
        <Input
          label="Price per sheet (THB)"
          type="number"
          step="0.25"
          min="0.25"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-2 border-t border-kumo-line">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" isLoading={isSaving} onClick={handleSave}>
            Save changes
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
