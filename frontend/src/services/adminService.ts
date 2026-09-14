import apiClient from './apiClient';
import { AdminTray, AdminJob, AdminStats, PricingRuleItem } from '../types/admin.types';

export async function getTrays(): Promise<AdminTray[]> {
  const res = await apiClient.get<{ success: boolean; data: AdminTray[] }>('/admin/trays');
  return res.data.data;
}

export async function updateTray(id: string, payload: Partial<AdminTray>): Promise<AdminTray> {
  const res = await apiClient.patch<{ success: boolean; data: AdminTray }>(`/admin/trays/${id}`, payload);
  return res.data.data;
}

export async function getJobs(status = 'ALL', page = 1, limit = 50): Promise<{
  jobs: AdminJob[];
  total: number;
  totalPages: number;
}> {
  const res = await apiClient.get<{
    success: boolean;
    data: AdminJob[];
    pagination: { total: number; totalPages: number };
  }>(`/admin/jobs?status=${status}&page=${page}&limit=${limit}`);

  return {
    jobs: res.data.data,
    total: res.data.pagination.total,
    totalPages: res.data.pagination.totalPages,
  };
}

export async function getPricingRules(): Promise<PricingRuleItem[]> {
  const res = await apiClient.get<{ success: boolean; data: PricingRuleItem[] }>('/admin/pricing');
  return res.data.data;
}

export async function updatePricingRule(id: string, pricePerPage: number): Promise<PricingRuleItem> {
  const res = await apiClient.patch<{ success: boolean; data: PricingRuleItem }>(`/admin/pricing/${id}`, {
    pricePerPage,
  });
  return res.data.data;
}

export async function getStats(): Promise<AdminStats> {
  const res = await apiClient.get<{ success: boolean; data: AdminStats }>('/admin/stats');
  return res.data.data;
}
