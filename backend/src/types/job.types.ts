export interface QuoteResponseData {
  quoteId: string;
  fileName: string;
  fileSizeBytes: number;
  pageCount: number;
  availableTrays: Array<{
    id: string;
    trayNumber: number;
    paperSize: string;
    colorCapability: string;
    isActive: boolean;
  }>;
  pricingMatrix: Array<{
    paperSize: string;
    isColor: boolean;
    isDuplex: boolean;
    pricePerPage: number;
  }>;
}

export interface CreateJobInput {
  quoteId: string;
  copies: number;
  pageRange?: string;
  paperSize: string;
  isColor: boolean;
  isDuplex: boolean;
  duplexEdge?: 'NONE' | 'LONG_EDGE' | 'SHORT_EDGE';
}

export interface CreateJobResponseData {
  jobId: string;
  orderCode: string;
  pageCount: number;
  copies: number;
  baseAmount: number;
  satangAmount: number;
  totalAmount: number;
  promptPayPayload: string;
  qrCodeDataUrl: string;
  expiresAt: string;
  expiresInSeconds: number;
}
