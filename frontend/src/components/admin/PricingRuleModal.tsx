'use client';

import React, { useEffect, useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { PricingRuleItem } from '../../types/admin.types';

interface PricingRuleModalProps {
  rule: PricingRuleItem | null;
  open: boolean;
  onClose: () => void;
  onSave: (payload: {
    paperSize: string;
    isColor: boolean;
    isDuplex: boolean;
    pricePerPage: number;
    isActive?: boolean;
  }) => Promise<void>;
}

export function PricingRuleModal({ rule, open, onClose, onSave }: PricingRuleModalProps) {
  const [paperSize, setPaperSize] = useState('A4');
  const [isColor, setIsColor] = useState(false);
  const [isDuplex, setIsDuplex] = useState(false);
  const [pricePerPage, setPricePerPage] = useState('2.00');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (rule) {
      setPaperSize(rule.paperSize);
      setIsColor(rule.isColor);
      setIsDuplex(rule.isDuplex);
      setPricePerPage(rule.pricePerPage.toString());
      setIsActive(rule.isActive !== undefined ? rule.isActive : true);
    } else {
      setPaperSize('A4');
      setIsColor(false);
      setIsDuplex(false);
      setPricePerPage('2.00');
      setIsActive(true);
    }
    setError(null);
  }, [rule, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(pricePerPage);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Price per page must be a positive number');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        paperSize,
        isColor,
        isDuplex,
        pricePerPage: priceNum,
        isActive,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to save pricing rule');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={rule ? 'Edit rate card' : 'Add new pricing rule'}
      description="Set customer pricing per sheet based on paper format, color mode, and duplexing."
    >
      <form onSubmit={handleSubmit} className="grid gap-4 mt-2">
        {error && (
          <div className="p-2.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-kumo-default">
              Paper size
            </label>
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value)}
              disabled={!!rule}
              className="w-full text-xs bg-kumo-control border border-kumo-line rounded-md px-3 py-2 text-kumo-default focus:outline-none focus:ring-1 focus:ring-kumo-brand"
            >
              <option value="A4">A4</option>
              <option value="A3">A3</option>
              <option value="Letter">Letter</option>
              <option value="Legal">Legal</option>
            </select>
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-kumo-default">
              Price per sheet (THB)
            </label>
            <Input
              type="number"
              step="0.25"
              min="0.10"
              value={pricePerPage}
              onChange={(e) => setPricePerPage(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rule-is-color"
              checked={isColor}
              onChange={(e) => setIsColor(e.target.checked)}
              disabled={!!rule}
              className="w-4 h-4 text-kumo-brand rounded border-kumo-line"
            />
            <label htmlFor="rule-is-color" className="text-xs text-kumo-default select-none">
              Color printing
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rule-is-duplex"
              checked={isDuplex}
              onChange={(e) => setIsDuplex(e.target.checked)}
              disabled={!!rule}
              className="w-4 h-4 text-kumo-brand rounded border-kumo-line"
            />
            <label htmlFor="rule-is-duplex" className="text-xs text-kumo-default select-none">
              Double-sided (Duplex)
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-kumo-line">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : rule ? 'Update rate' : 'Create rule'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
