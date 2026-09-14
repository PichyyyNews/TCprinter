import apiClient from './apiClient';

export interface VerifySlipResponse {
  jobId: string;
  extractedAmount: number;
  transactionRef: string;
  status: 'PAID' | 'REJECTED';
  reason?: string;
}

export async function verifySlip(jobId: string, slipImage: File): Promise<VerifySlipResponse> {
  const formData = new FormData();
  formData.append('jobId', jobId);
  formData.append('slipImage', slipImage);

  const response = await apiClient.post<{ success: boolean; data: VerifySlipResponse }>(
    '/payments/verify-slip',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data.data;
}

export async function sendSimulatedWebhook(amount: number): Promise<{ success: boolean; matched: boolean }> {
  const response = await apiClient.post('/payments/webhook', {
    bank: 'SCB_TEST',
    amount,
    rawText: `เงินเข้า ${amount.toFixed(2)} บาท บัญชีตู้พิมพ์`,
    timestamp: new Date().toISOString(),
  }, {
    headers: {
      'X-Webhook-Secret': 'tcp_webhook_secret_key_2026',
    },
  });

  return response.data;
}
