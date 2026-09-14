'use client';

import React from 'react';
import { FilePdf, ArrowCounterClockwise } from '@phosphor-icons/react';
import { useKioskStore } from '../../stores/kioskStore';
import { LayerCard } from '../ui/LayerCard';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatBytes } from '../../lib/formatters';

export function PdfPreviewCard() {
  const file = useKioskStore((s) => s.file);
  const quote = useKioskStore((s) => s.quote);
  const resetKiosk = useKioskStore((s) => s.resetKiosk);

  if (!quote) return null;

  return (
    <LayerCard className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2.5 bg-orange-50 text-kumo-brand rounded-lg shrink-0">
          <FilePdf size={28} weight="thin" />
        </div>
        <div className="grid gap-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-kumo-strong truncate max-w-[200px] sm:max-w-xs">
              {quote.fileName || file?.name || 'Document.pdf'}
            </span>
            <Badge variant="brand">
              {quote.pageCount} {quote.pageCount === 1 ? 'page' : 'pages'}
            </Badge>
          </div>
          <span className="text-xs text-kumo-subtle">
            {formatBytes(quote.fileSizeBytes || file?.size || 0)} • Ready for printing
          </span>
        </div>
      </div>

      <Button
        variant="subtle"
        size="sm"
        onClick={resetKiosk}
        className="shrink-0 text-xs"
      >
        <span className="h-lh flex items-center gap-1.5">
          <ArrowCounterClockwise size={14} weight="thin" />
          <span>Upload another file</span>
        </span>
      </Button>
    </LayerCard>
  );
}
