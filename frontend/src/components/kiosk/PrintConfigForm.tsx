'use client';

import React from 'react';
import { Copy, FileText, Palette, ArrowsClockwise, Minus, Plus } from '@phosphor-icons/react';
import { useKioskStore } from '../../stores/kioskStore';
import { LayerCard } from '../ui/LayerCard';
import { Switch } from '../ui/Switch';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/cn';

export function PrintConfigForm() {
  const config = useKioskStore((s) => s.config);
  const updateConfig = useKioskStore((s) => s.updateConfig);
  const quote = useKioskStore((s) => s.quote);

  if (!quote) return null;

  const handleCopiesChange = (delta: number) => {
    const next = Math.max(1, Math.min(99, config.copies + delta));
    updateConfig({ copies: next });
  };

  const hasA3Tray = quote.availableTrays?.some((t) => t.paperSize === 'A3' && t.isActive);

  return (
    <LayerCard className="grid gap-6">
      <div className="grid gap-1">
        <h2 className="text-base font-semibold text-kumo-strong">
          Print settings
        </h2>
        <p className="text-sm text-kumo-subtle">
          Configure paper size, color options, and copy count
        </p>
      </div>

      <div className="grid gap-5">
        {/* Paper Size */}
        <div className="grid gap-2">
          <label className="text-xs font-medium text-kumo-subtle">
            Paper size
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => updateConfig({ paperSize: 'A4' })}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border text-left cursor-pointer',
                config.paperSize === 'A4'
                  ? 'border-kumo-brand bg-orange-50/30 ring-1 ring-kumo-brand'
                  : 'border-kumo-line bg-kumo-base hover:bg-kumo-tint'
              )}
            >
              <div className="grid gap-0.5">
                <span className="font-medium text-sm text-kumo-strong">A4 standard</span>
                <span className="text-xs text-kumo-subtle">210 × 297 mm</span>
              </div>
              <Badge variant={config.paperSize === 'A4' ? 'brand' : 'neutral'}>
                Tray 1 & 2
              </Badge>
            </button>

            <button
              type="button"
              disabled={!hasA3Tray}
              onClick={() => updateConfig({ paperSize: 'A3' })}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border text-left cursor-pointer',
                config.paperSize === 'A3'
                  ? 'border-kumo-brand bg-orange-50/30 ring-1 ring-kumo-brand'
                  : 'border-kumo-line bg-kumo-base hover:bg-kumo-tint',
                !hasA3Tray && 'opacity-40 cursor-not-allowed'
              )}
            >
              <div className="grid gap-0.5">
                <span className="font-medium text-sm text-kumo-strong">A3 large</span>
                <span className="text-xs text-kumo-subtle">297 × 420 mm</span>
              </div>
              <Badge variant={config.paperSize === 'A3' ? 'brand' : 'neutral'}>
                {hasA3Tray ? 'Tray 3' : 'Out of stock'}
              </Badge>
            </button>
          </div>
        </div>

        {/* Color Mode */}
        <div className="grid gap-2">
          <label className="text-xs font-medium text-kumo-subtle">
            Color mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => updateConfig({ isColor: false })}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border text-left cursor-pointer',
                !config.isColor
                  ? 'border-kumo-brand bg-orange-50/30 ring-1 ring-kumo-brand'
                  : 'border-kumo-line bg-kumo-base hover:bg-kumo-tint'
              )}
            >
              <div className="p-2 rounded bg-neutral-100 text-neutral-600">
                <FileText size={20} weight="thin" />
              </div>
              <div className="grid gap-0.5">
                <span className="font-medium text-sm text-kumo-strong">Black & white</span>
                <span className="text-xs text-kumo-subtle">Economical standard</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => updateConfig({ isColor: true })}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border text-left cursor-pointer',
                config.isColor
                  ? 'border-kumo-brand bg-orange-50/30 ring-1 ring-kumo-brand'
                  : 'border-kumo-line bg-kumo-base hover:bg-kumo-tint'
              )}
            >
              <div className="p-2 rounded bg-orange-100 text-kumo-brand">
                <Palette size={20} weight="thin" />
              </div>
              <div className="grid gap-0.5">
                <span className="font-medium text-sm text-kumo-strong">Color</span>
                <span className="text-xs text-kumo-subtle">High resolution photo/text</span>
              </div>
            </button>
          </div>
        </div>

        {/* Duplex (Double-sided) */}
        <div className="pt-2 border-t border-kumo-line">
          <div className="flex items-center justify-between py-2">
            <div className="grid gap-1">
              <span className="text-sm font-medium text-kumo-strong">
                Double-sided printing (Duplex)
              </span>
              <span className="text-xs text-kumo-subtle">
                Prints on both sides of each sheet to reduce paper usage
              </span>
            </div>
            <Switch
              checked={config.isDuplex}
              onCheckedChange={(checked) =>
                updateConfig({
                  isDuplex: checked,
                  duplexEdge: checked ? 'LONG_EDGE' : 'NONE',
                })
              }
            />
          </div>

          {config.isDuplex && (
            <div className="mt-3 grid grid-cols-2 gap-3 pl-4 border-l-2 border-kumo-brand">
              <button
                type="button"
                onClick={() => updateConfig({ duplexEdge: 'LONG_EDGE' })}
                className={cn(
                  'p-2.5 rounded-md border text-xs font-medium text-left cursor-pointer',
                  config.duplexEdge === 'LONG_EDGE'
                    ? 'border-kumo-brand bg-orange-50/40 text-kumo-brand'
                    : 'border-kumo-line text-kumo-default hover:bg-kumo-tint'
                )}
              >
                Flip on long edge (Standard book)
              </button>
              <button
                type="button"
                onClick={() => updateConfig({ duplexEdge: 'SHORT_EDGE' })}
                className={cn(
                  'p-2.5 rounded-md border text-xs font-medium text-left cursor-pointer',
                  config.duplexEdge === 'SHORT_EDGE'
                    ? 'border-kumo-brand bg-orange-50/40 text-kumo-brand'
                    : 'border-kumo-line text-kumo-default hover:bg-kumo-tint'
                )}
              >
                Flip on short edge (Calendar / Notepad)
              </button>
            </div>
          )}
        </div>

        {/* Copies Counter & Page Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-kumo-line">
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-kumo-subtle">
              Number of copies
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleCopiesChange(-1)}
                disabled={config.copies <= 1}
                className="p-2 rounded-md border border-kumo-line hover:bg-kumo-tint disabled:opacity-40 text-kumo-default cursor-pointer"
              >
                <Minus size={14} weight="thin" />
              </button>
              <span className="font-semibold text-base text-kumo-strong w-8 text-center select-none">
                {config.copies}
              </span>
              <button
                type="button"
                onClick={() => handleCopiesChange(1)}
                disabled={config.copies >= 99}
                className="p-2 rounded-md border border-kumo-line hover:bg-kumo-tint disabled:opacity-40 text-kumo-default cursor-pointer"
              >
                <Plus size={14} weight="thin" />
              </button>
            </div>
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-kumo-subtle">
              Pages to print
            </label>
            <input
              type="text"
              value={config.pageRange}
              onChange={(e) => updateConfig({ pageRange: e.target.value })}
              placeholder="e.g. all or 1-5, 8"
              className="w-full bg-kumo-control border border-kumo-line rounded-md px-3 py-1.5 text-sm text-kumo-default placeholder:text-kumo-subtle focus:ring-1 focus:ring-kumo-brand outline-none"
            />
          </div>
        </div>
      </div>
    </LayerCard>
  );
}
