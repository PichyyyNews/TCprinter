'use client';

import React, { useState } from 'react';
import { UploadSimple, FileImage, WarningCircle, CheckCircle } from '@phosphor-icons/react';
import { useKioskStore } from '../../stores/kioskStore';
import { verifySlip } from '../../services/paymentService';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';

export function SlipUploadModal() {
  const isSlipModalOpen = useKioskStore((s) => s.isSlipModalOpen);
  const setSlipModalOpen = useKioskStore((s) => s.setSlipModalOpen);
  const activeJob = useKioskStore((s) => s.activeJob);
  const setActiveJob = useKioskStore((s) => s.setActiveJob);
  const setStep = useKioskStore((s) => s.setStep);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMessage(null);
    }
  };

  const handleVerify = async () => {
    if (!selectedFile || !activeJob) return;

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const result = await verifySlip(activeJob.jobId, selectedFile);
      if (result.status === 'PAID') {
        setActiveJob({ ...activeJob, status: 'PAID' });
        setSlipModalOpen(false);
        setStep('PRINTING');
      } else {
        setErrorMessage(result.reason || 'Slip verification failed. Please check your image.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing slip. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog
      open={isSlipModalOpen}
      onOpenChange={setSlipModalOpen}
      title="Upload transfer slip"
      description="Upload your bank receipt image for instant AI OCR verification"
      className="max-w-md"
    >
      <div className="grid gap-4">
        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-kumo-line rounded-lg cursor-pointer hover:bg-kumo-tint bg-kumo-canvas">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {previewUrl ? (
            <div className="relative w-full max-h-48 flex justify-center">
              <img
                src={previewUrl}
                alt="Slip preview"
                className="max-h-48 object-contain rounded-md"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center text-center gap-2">
              <div className="p-3 bg-white rounded-full border border-kumo-line text-kumo-subtle">
                <FileImage size={28} weight="thin" />
              </div>
              <div className="grid gap-0.5">
                <span className="text-sm font-medium text-kumo-strong">
                  Click to select slip image
                </span>
                <span className="text-xs text-kumo-subtle">
                  Supports JPEG, PNG from your mobile banking app
                </span>
              </div>
            </div>
          )}
        </label>

        {errorMessage && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700">
            <span className="h-lh flex items-center">
              <WarningCircle size={14} weight="thin" />
            </span>
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-kumo-line">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSlipModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!selectedFile}
            isLoading={isVerifying}
            onClick={handleVerify}
          >
            <span className="h-lh flex items-center gap-1.5">
              <CheckCircle size={14} weight="thin" />
              <span>Verify & start printing</span>
            </span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
