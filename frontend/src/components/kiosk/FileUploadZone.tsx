'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FilePdf, UploadSimple, WarningCircle } from '@phosphor-icons/react';
import { useKioskStore } from '../../stores/kioskStore';
import { uploadPdf } from '../../services/jobService';
import { LayerCard } from '../ui/LayerCard';
import { cn } from '../../lib/cn';

export function FileUploadZone() {
  const [isHovered, setIsHovered] = useState(false);
  const isUploading = useKioskStore((s) => s.isUploading);
  const setIsUploading = useKioskStore((s) => s.setIsUploading);
  const setFileAndQuote = useKioskStore((s) => s.setFileAndQuote);
  const errorMessage = useKioskStore((s) => s.errorMessage);
  const setErrorMessage = useKioskStore((s) => s.setErrorMessage);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];

      if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
        setErrorMessage('Please upload a valid PDF document.');
        return;
      }

      setIsUploading(true);
      setErrorMessage(null);

      try {
        const quote = await uploadPdf(file);
        setFileAndQuote(file, quote);
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to upload document. Please try again.');
      } finally {
        setIsUploading(false);
      }
    },
    [setIsUploading, setFileAndQuote, setErrorMessage]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <div className="w-full grid gap-3">
      <LayerCard className="p-0 overflow-hidden">
        <div
          {...getRootProps()}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            'flex flex-col items-center justify-center text-center p-10 cursor-pointer border-2 border-dashed rounded-lg transition-transform',
            isDragActive || isHovered
              ? 'border-kumo-brand bg-orange-50/20'
              : 'border-kumo-line bg-kumo-base hover:bg-kumo-tint',
            isUploading && 'opacity-60 cursor-not-allowed'
          )}
        >
          <input {...getInputProps()} />

          <div className="mb-4 text-kumo-brand">
            {isUploading ? (
              <svg
                className="animate-spin h-10 w-10 text-kumo-brand"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : isDragActive ? (
              <FilePdf size={44} weight="thin" />
            ) : (
              <UploadSimple size={44} weight="thin" />
            )}
          </div>

          <div className="grid gap-1 mb-2">
            <h3 className="text-base font-semibold text-kumo-strong">
              {isUploading
                ? 'Analyzing PDF document...'
                : isDragActive
                ? 'Drop your PDF file here'
                : 'Upload your PDF document'}
            </h3>
            <p className="text-sm text-kumo-subtle">
              Drag and drop your file here, or click to browse from device
            </p>
          </div>

          <div className="text-xs text-kumo-subtle font-mono text-[0.9em] mt-2">
            PDF files only • Maximum size 50 MB
          </div>
        </div>
      </LayerCard>

      {errorMessage && (
        <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-md text-sm text-rose-700">
          <span className="h-lh flex items-center">
            <WarningCircle size={16} weight="thin" />
          </span>
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
