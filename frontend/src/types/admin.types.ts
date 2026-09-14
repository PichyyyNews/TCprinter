export interface AdminPrinter {
  id: string;
  name: string;
  driverName: string;
  connectionType: 'USB' | 'LAN' | 'VIRTUAL' | 'LOCAL';
  status: 'ONLINE' | 'OFFLINE' | 'ERROR';
  totalSheetsPrinted: number;
  lastSeen: string;
  trays?: AdminTray[];
  createdAt: string;
  updatedAt: string;
}

export interface DiscoveredPrinter {
  name: string;
  driverName: string;
  portName: string;
  connectionType: 'USB' | 'LAN' | 'VIRTUAL' | 'LOCAL';
  isOnline: boolean;
  rawStatus?: number;
}

export interface AdminTray {
  id: string;
  printerId: string;
  trayNumber: number;
  paperSize: string;
  colorCapability: 'MONOCHROME' | 'COLOR' | 'ANY';
  isActive: boolean;
  status: 'OK' | 'OUT_OF_PAPER' | 'PAPER_JAM' | 'DISABLED';
  paperRemaining: number;
  printer?: {
    id: string;
    name: string;
  };
  updatedAt: string;
}

export interface PricingRuleItem {
  id: string;
  paperSize: string;
  isColor: boolean;
  isDuplex: boolean;
  pricePerPage: number;
  isActive: boolean;
}

export interface PaymentLogItem {
  id: string;
  jobId?: string | null;
  method: 'NOTIFICATION_WEBHOOK' | 'OCR_SLIP' | 'MANUAL_ADMIN';
  bankName?: string | null;
  amountReceived: number;
  slipHash?: string | null;
  slipTxRef?: string | null;
  rawPayload?: string | null;
  isMatched: boolean;
  createdAt: string;
  job?: {
    id: string;
    orderCode: string;
    originalFileName: string;
    status: string;
    totalAmount: number;
  } | null;
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
  duplexEdge?: string;
  totalAmount: number;
  status: string;
  failureReason?: string | null;
  createdAt: string;
  paidAt?: string | null;
  completedAt?: string | null;
  targetTray?: {
    id: string;
    trayNumber: number;
    paperSize: string;
    printer?: {
      name: string;
    };
  } | null;
  paymentLogs?: PaymentLogItem[];
}

export interface AgentStatusInfo {
  isConnected: boolean;
  socketCount: number;
  lastHeartbeat: string | null;
  printerStatus: string;
  driverMode: string;
  agentTokenConfigured: boolean;
}

export interface SystemConfigItem {
  key: string;
  value: string;
  description?: string | null;
  updatedAt: string;
}

export interface EnvironmentSummary {
  PORT: number;
  NODE_ENV: string;
  CORS_ORIGIN: string;
  PROMPTPAY_TARGET: string;
  WEBHOOK_TOLERANCE_MINUTES: number;
  ORDER_TIMEOUT_SECONDS: number;
  WEBHOOK_SECRET_MASKED: string;
  AGENT_TOKEN_MASKED: string;
}

export interface NotificationResponseData {
  data: PaymentLogItem[];
  webhookConfig: {
    endpointUrl: string;
    webhookSecret: string;
    toleranceMinutes: number;
  };
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AdminStats {
  totalJobsCompleted: number;
  totalRevenue: number;
  totalPagesPrinted: number;
  totalSheetsConsumed: number;
  totalSheetsPrintedOnPrinters?: number;
  activeQueuedJobs: number;
  totalPrinters: number;
  onlinePrinters: number;
  totalPaperRemaining: number;
  agentStatus?: AgentStatusInfo;
}
