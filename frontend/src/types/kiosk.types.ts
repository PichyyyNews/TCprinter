// frontend/src/types/kiosk.types.ts

export type KioskStep = 'UPLOAD' | 'CONFIG' | 'PAYMENT' | 'PRINTING' | 'COMPLETED';

export interface TrayInfo {
  id: string;
  trayNumber: number;
  paperSize: string;
  colorCapability: 'MONOCHROME' | 'COLOR' | 'ANY';
  isActive: boolean;
}

export interface PricingRate {
  paperSize: string;
  isColor: boolean;
  isDuplex: boolean;
  pricePerPage: number;
}

export interface PrintOrderConfig {
  copies: number;
  pageRange: string;
  paperSize: string;
  isColor: boolean;
  isDuplex: boolean;
  duplexEdge: 'NONE' | 'LONG_EDGE' | 'SHORT_EDGE';
}

export interface ActiveJobState {
  jobId: string;
  orderCode: string;
  totalAmount: number;
  baseAmount: number;
  satangAmount: number;
  promptPayPayload: string;
  qrCodeDataUrl: string;
  expiresAt: string;
  status: 'PENDING_PAYMENT' | 'PAID' | 'PRINTING' | 'COMPLETED' | 'FAILED';
}
