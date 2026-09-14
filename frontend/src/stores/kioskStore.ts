import { create } from 'zustand';
import { KioskStep, PrintOrderConfig, ActiveJobState } from '../types/kiosk.types';
import { QuoteResult } from '../services/jobService';

interface KioskState {
  step: KioskStep;
  file: File | null;
  quote: QuoteResult | null;
  config: PrintOrderConfig;
  activeJob: ActiveJobState | null;
  isUploading: boolean;
  isCreatingJob: boolean;
  isSlipModalOpen: boolean;
  errorMessage: string | null;

  setStep: (step: KioskStep) => void;
  setFileAndQuote: (file: File, quote: QuoteResult) => void;
  updateConfig: (patch: Partial<PrintOrderConfig>) => void;
  setActiveJob: (job: ActiveJobState | null) => void;
  setSlipModalOpen: (open: boolean) => void;
  setErrorMessage: (msg: string | null) => void;
  setIsUploading: (uploading: boolean) => void;
  setIsCreatingJob: (creating: boolean) => void;
  resetKiosk: () => void;
}

const initialConfig: PrintOrderConfig = {
  copies: 1,
  pageRange: 'all',
  paperSize: 'A4',
  isColor: false,
  isDuplex: false,
  duplexEdge: 'NONE',
};

export const useKioskStore = create<KioskState>((set) => ({
  step: 'UPLOAD',
  file: null,
  quote: null,
  config: initialConfig,
  activeJob: null,
  isUploading: false,
  isCreatingJob: false,
  isSlipModalOpen: false,
  errorMessage: null,

  setStep: (step) => set({ step }),
  setFileAndQuote: (file, quote) => set({ file, quote, step: 'CONFIG', errorMessage: null }),
  updateConfig: (patch) =>
    set((state) => ({
      config: { ...state.config, ...patch },
    })),
  setActiveJob: (job) => set({ activeJob: job }),
  setSlipModalOpen: (isSlipModalOpen) => set({ isSlipModalOpen }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  setIsUploading: (isUploading) => set({ isUploading }),
  setIsCreatingJob: (isCreatingJob) => set({ isCreatingJob }),
  resetKiosk: () =>
    set({
      step: 'UPLOAD',
      file: null,
      quote: null,
      config: initialConfig,
      activeJob: null,
      isUploading: false,
      isCreatingJob: false,
      isSlipModalOpen: false,
      errorMessage: null,
    }),
}));
