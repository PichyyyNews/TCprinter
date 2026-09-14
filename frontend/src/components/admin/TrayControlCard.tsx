'use client';

import React, { useState } from 'react';
import { Tray, ArrowsCounterClockwise } from '@phosphor-icons/react';
import { AdminTray } from '../../types/admin.types';
import { updateTray } from '../../services/adminService';
import { LayerCard } from '../ui/LayerCard';
import { Switch } from '../ui/Switch';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Meter } from '../ui/Meter';

export interface TrayControlCardProps {
  tray: AdminTray;
  onUpdated: (updated: AdminTray) => void;
}

export function TrayControlCard({ tray, onUpdated }: TrayControlCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggleActive = async (checked: boolean) => {
    setIsUpdating(true);
    try {
      const updated = await updateTray(tray.id, { isActive: checked });
      onUpdated(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRefillPaper = async () => {
    setIsUpdating(true);
    try {
      const updated = await updateTray(tray.id, {
        paperRemaining: 500,
        status: 'OK',
      });
      onUpdated(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadgeVariant = () => {
    if (!tray.isActive || tray.status === 'DISABLED') return 'neutral';
    if (tray.status === 'OUT_OF_PAPER') return 'critical';
    if (tray.status === 'PAPER_JAM') return 'warning';
    return 'success';
  };

  return (
    <LayerCard className="grid gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-kumo-recessed text-kumo-default rounded-lg border border-kumo-line">
            <Tray size={22} weight="thin" />
          </div>
          <div className="grid gap-0.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-kumo-strong">
                Tray {tray.trayNumber}
              </span>
              <Badge variant={getStatusBadgeVariant()}>
                {tray.isActive ? tray.status : 'Inactive'}
              </Badge>
            </div>
            <span className="text-xs text-kumo-subtle">
              {tray.paperSize} • {tray.colorCapability}
            </span>
          </div>
        </div>

        <Switch
          checked={tray.isActive}
          disabled={isUpdating}
          onCheckedChange={handleToggleActive}
        />
      </div>

      <div className="pt-2 border-t border-kumo-line grid gap-3">
        <Meter value={tray.paperRemaining} max={500} />

        <div className="flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            disabled={isUpdating}
            onClick={handleRefillPaper}
            className="text-xs"
          >
            <span className="h-lh flex items-center gap-1.5">
              <ArrowsCounterClockwise size={12} weight="thin" />
              <span>Refill to 500 sheets</span>
            </span>
          </Button>
        </div>
      </div>
    </LayerCard>
  );
}
