export interface WebhookPayload {
  bank?: string;
  amount: number;
  rawText?: string;
  timestamp?: string;
}

export interface VerifySlipResult {
  jobId: string;
  extractedAmount: number;
  transactionRef: string;
  status: 'PAID' | 'REJECTED';
  reason?: string;
}
