import React, { useEffect } from 'react';
import { X } from '@phosphor-icons/react';
import { cn } from '../../lib/cn';

export interface DialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onOpenChange,
  onClose,
  title,
  description,
  children,
  className,
}: DialogProps) {
  const handleClose = () => {
    if (onClose) onClose();
    if (onOpenChange) onOpenChange(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, onOpenChange]);

  // Rule 15: Never conditionally render dialogs in JSX tree.
  // Use CSS visibility / opacity to support smooth open/close transitions without DOM tearing.
  return (
    <div
      aria-hidden={!open}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200',
        open
          ? 'opacity-100 pointer-events-auto bg-black/40 backdrop-blur-sm'
          : 'opacity-0 pointer-events-none'
      )}
    >
      <div
        className={cn(
          'relative w-full max-w-lg bg-kumo-base border border-kumo-line rounded-xl shadow-xl px-6 py-5 transform transition-transform duration-200',
          open ? 'scale-100' : 'scale-95',
          className
        )}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="grid gap-1">
            {title && (
              <h3 className="text-base font-semibold text-kumo-strong">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-kumo-subtle">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-kumo-subtle hover:text-kumo-default p-1 rounded-md hover:bg-kumo-tint"
            aria-label="Close dialog"
          >
            <X size={18} weight="thin" />
          </button>
        </div>

        <div className="text-sm text-kumo-default">
          {children}
        </div>
      </div>
    </div>
  );
}
