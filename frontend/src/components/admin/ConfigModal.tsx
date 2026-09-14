'use client';

import React, { useEffect, useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SystemConfigItem } from '../../types/admin.types';

interface ConfigModalProps {
  config: SystemConfigItem | null;
  open: boolean;
  onClose: () => void;
  onSave: (payload: { key: string; value: string; description?: string }) => Promise<void>;
}

export function ConfigModal({ config, open, onClose, onSave }: ConfigModalProps) {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (config) {
      setKey(config.key);
      setValue(config.value);
      setDescription(config.description || '');
    } else {
      setKey('');
      setValue('');
      setDescription('');
    }
    setError(null);
  }, [config, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) {
      setError('Configuration key is required');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        key: key.trim(),
        value,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={config ? `Edit '${config.key}'` : 'Add system setting'}
      description="Dynamic runtime configuration stored in the kiosk database."
    >
      <form onSubmit={handleSubmit} className="grid gap-4 mt-2">
        {error && (
          <div className="p-2.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-kumo-default">
            Configuration key
          </label>
          <Input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            disabled={!!config}
            placeholder="e.g. store_name or cleanup_cron"
            required
          />
        </div>

        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-kumo-default">
            Value
          </label>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Configuration value"
            required
          />
        </div>

        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-kumo-default">
            Description / Operator note (optional)
          </label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain what this configuration controls"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-kumo-line">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : config ? 'Update config' : 'Create config'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
