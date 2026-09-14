import apiClient from './apiClient';
import { TrayInfo, PricingRate, PrintOrderConfig, ActiveJobState } from '../types/kiosk.types';

export interface QuoteResult {
  quoteId: string;
  fileName: string;
  fileSizeBytes: number;
  pageCount: number;
  availableTrays: TrayInfo[];
  pricingMatrix: PricingRate[];
}

export async function uploadPdf(file: File): Promise<QuoteResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<{ success: boolean; data: QuoteResult }>('/jobs/quote', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data;
}

export async function createJob(params: PrintOrderConfig & { quoteId: string }): Promise<ActiveJobState> {
  const response = await apiClient.post<{ success: boolean; data: ActiveJobState }>('/jobs/create', params);
  return response.data.data;
}

export async function getJobStatus(jobId: string): Promise<ActiveJobState> {
  const response = await apiClient.get<{ success: boolean; data: ActiveJobState }>(`/jobs/${jobId}/status`);
  return response.data.data;
}
