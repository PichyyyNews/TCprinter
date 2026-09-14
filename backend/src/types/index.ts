// backend/src/types/index.ts

export type JobStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'DISPATCHED'
  | 'PRINTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED';

export type PaymentMethod = 'NOTIFICATION_WEBHOOK' | 'OCR_SLIP' | 'MANUAL_ADMIN';

export type TrayStatus = 'OK' | 'OUT_OF_PAPER' | 'PAPER_JAM' | 'DISABLED';

export type ColorCapability = 'MONOCHROME' | 'COLOR' | 'ANY';

export type DuplexEdge = 'NONE' | 'LONG_EDGE' | 'SHORT_EDGE';

export interface PrintSettings {
  paperSize: string;
  isColor: boolean;
  isDuplex: boolean;
  duplexEdge: DuplexEdge;
  copies: number;
  pageRange: string;
  trayNumber?: number;
}
