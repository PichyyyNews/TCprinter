export interface AdminTray {
  id: string;
  trayNumber: number;
  paperSize: string;
  colorCapability: 'MONOCHROME' | 'COLOR' | 'ANY';
  isActive: boolean;
  status: 'OK' | 'OUT_OF_PAPER' | 'PAPER_JAM' | 'DISABLED';
  paperRemaining: number;
  updatedAt: string;
}

export interface AdminJob {
  id: string;
  orderCode: string;
  originalFileName: string;
  pageCount: number;
  copies: number;
  paperSize: string;
  isColor: boolean;
  isDuplex: boolean;
  totalAmount: number;
  status: string;
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
  targetTray?: {
    trayNumber: number;
    paperSize: string;
  };
}

export interface AdminStats {
  totalJobsCompleted: number;
  totalRevenue: number;
  totalPagesPrinted: number;
  activeQueuedJobs: number;
}

export interface PricingRuleItem {
  id: string;
  paperSize: string;
  isColor: boolean;
  isDuplex: boolean;
  pricePerPage: number;
  isActive: boolean;
}
