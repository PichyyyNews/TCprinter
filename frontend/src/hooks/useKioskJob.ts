'use client';

import { useEffect, useState } from 'react';
import { useKioskStore } from '../stores/kioskStore';
import { useSocket } from './useSocket';

export function useKioskJob() {
  const socket = useSocket();
  const activeJob = useKioskStore((s) => s.activeJob);
  const setActiveJob = useKioskStore((s) => s.setActiveJob);
  const setStep = useKioskStore((s) => s.setStep);
  const setErrorMessage = useKioskStore((s) => s.setErrorMessage);

  const [remainingSeconds, setRemainingSeconds] = useState<number>(900);
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    if (!activeJob || !socket) return;

    // Join room for this specific job
    socket.emit('join:job', activeJob.jobId);

    const onPaymentConfirmed = (data: { jobId: string; orderCode: string; message: string }) => {
      if (data.jobId === activeJob.jobId) {
        setActiveJob({
          ...activeJob,
          status: 'PAID',
        });
        setStatusMessage(data.message || 'Payment confirmed, printing starting...');
        setStep('PRINTING');
      }
    };

    const onStatusChanged = (data: { jobId: string; status: any; message?: string; error?: string }) => {
      if (data.jobId === activeJob.jobId) {
        setActiveJob({
          ...activeJob,
          status: data.status,
        });

        if (data.message) {
          setStatusMessage(data.message);
        }

        if (data.status === 'COMPLETED') {
          setStep('COMPLETED');
        } else if (data.status === 'FAILED') {
          setErrorMessage(data.error || data.message || 'Print job encountered an error');
        }
      }
    };

    const onExpired = (data: { jobId: string; message: string }) => {
      if (data.jobId === activeJob.jobId) {
        setActiveJob({
          ...activeJob,
          status: 'FAILED',
        });
        setErrorMessage(data.message || 'Payment window expired. Please try again.');
      }
    };

    socket.on('payment:confirmed', onPaymentConfirmed);
    socket.on('job:status_changed', onStatusChanged);
    socket.on('job:expired', onExpired);

    return () => {
      socket.off('payment:confirmed', onPaymentConfirmed);
      socket.off('job:status_changed', onStatusChanged);
      socket.off('job:expired', onExpired);
      socket.emit('leave:job', activeJob.jobId);
    };
  }, [activeJob, socket, setActiveJob, setStep, setErrorMessage]);

  // Countdown timer effect
  useEffect(() => {
    if (!activeJob?.expiresAt) return;

    const interval = setInterval(() => {
      const exp = new Date(activeJob.expiresAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((exp - now) / 1000));
      setRemainingSeconds(diff);

      if (diff <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeJob?.expiresAt]);

  return {
    remainingSeconds,
    statusMessage,
  };
}
