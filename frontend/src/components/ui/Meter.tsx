import React from 'react';
import { cn } from '../../lib/cn';

export interface MeterProps {
  value: number; // e.g. remaining sheets
  max?: number;  // e.g. 500 capacity
  className?: string;
  showLabel?: boolean;
}

export function Meter({ value, max = 500, className, showLabel = true }: MeterProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  let colorClass = 'bg-kumo-brand';
  if (percentage < 15) {
    colorClass = 'bg-kumo-critical';
  } else if (percentage < 30) {
    colorClass = 'bg-kumo-warning';
  } else {
    colorClass = 'bg-emerald-500';
  }

  return (
    <div className={cn('w-full grid gap-1.5', className)}>
      <div className="w-full h-2 bg-kumo-recessed rounded-full overflow-hidden border border-kumo-line">
        <div
          className={cn('h-full transition-all duration-300 rounded-full', colorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between text-xs text-kumo-subtle">
          <span>{value} sheets remaining</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  );
}
