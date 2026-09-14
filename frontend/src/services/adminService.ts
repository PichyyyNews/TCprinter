import apiClient from './apiClient';
import {
  AdminPrinter,
  DiscoveredPrinter,
  AdminTray,
  AdminJob,
  AdminStats,
  PricingRuleItem,
  PaymentLogItem,
  NotificationResponseData,
  AgentStatusInfo,
  SystemConfigItem,
  EnvironmentSummary,
} from '../types/admin.types';

// ==================== PRINTERS ====================

export async function getPrinters(): Promise<AdminPrinter[]> {
  const res = await apiClient.get<{ success: boolean; data: AdminPrinter[] }>('/admin/printers');
  return res.data.data;
}

export async function createPrinter(payload: {
  name: string;
  driverName: string;
  connectionType?: string;
  status?: string;
}): Promise<AdminPrinter> {
  const res = await apiClient.post<{ success: boolean; data: AdminPrinter }>('/admin/printers', payload);
  return res.data.data;
}

export async function updatePrinter(id: string, payload: Partial<AdminPrinter>): Promise<AdminPrinter> {
  const res = await apiClient.patch<{ success: boolean; data: AdminPrinter }>(`/admin/printers/${id}`, payload);
  return res.data.data;
}

export async function deletePrinter(id: string): Promise<void> {
  await apiClient.delete(`/admin/printers/${id}`);
}

export async function discoverPrinters(): Promise<DiscoveredPrinter[]> {
  const res = await apiClient.get<{ success: boolean; data: DiscoveredPrinter[] }>('/admin/printers/discover');
  return res.data.data;
}

// ==================== TRAYS ====================

export async function getTrays(): Promise<AdminTray[]> {
  const res = await apiClient.get<{ success: boolean; data: AdminTray[] }>('/admin/trays');
  return res.data.data;
}

export async function createTray(payload: {
  printerId: string;
  trayNumber: number;
  paperSize?: string;
  colorCapability?: string;
  paperRemaining?: number;
  isActive?: boolean;
}): Promise<AdminTray> {
  const res = await apiClient.post<{ success: boolean; data: AdminTray }>('/admin/trays', payload);
  return res.data.data;
}

export async function updateTray(id: string, payload: Partial<AdminTray>): Promise<AdminTray> {
  const res = await apiClient.patch<{ success: boolean; data: AdminTray }>(`/admin/trays/${id}`, payload);
  return res.data.data;
}

export async function deleteTray(id: string): Promise<void> {
  await apiClient.delete(`/admin/trays/${id}`);
}

// ==================== PRICING RULES ====================

export async function getPricingRules(): Promise<PricingRuleItem[]> {
  const res = await apiClient.get<{ success: boolean; data: PricingRuleItem[] }>('/admin/pricing');
  return res.data.data;
}

export async function createPricingRule(payload: {
  paperSize: string;
  isColor: boolean;
  isDuplex: boolean;
  pricePerPage: number;
  isActive?: boolean;
}): Promise<PricingRuleItem> {
  const res = await apiClient.post<{ success: boolean; data: PricingRuleItem }>('/admin/pricing', payload);
  return res.data.data;
}

export async function updatePricingRule(
  id: string,
  pricePerPage: number,
  isActive?: boolean
): Promise<PricingRuleItem> {
  const res = await apiClient.patch<{ success: boolean; data: PricingRuleItem }>(`/admin/pricing/${id}`, {
    pricePerPage,
    isActive,
  });
  return res.data.data;
}

export async function deletePricingRule(id: string): Promise<void> {
  await apiClient.delete(`/admin/pricing/${id}`);
}

// ==================== JOBS AUDIT ====================

export async function getJobs(
  status = 'ALL',
  page = 1,
  limit = 50,
  search?: string
): Promise<{
  jobs: AdminJob[];
  total: number;
  totalPages: number;
}> {
  let url = `/admin/jobs?status=${status}&page=${page}&limit=${limit}`;
  if (search && search.trim().length > 0) {
    url += `&search=${encodeURIComponent(search.trim())}`;
  }

  const res = await apiClient.get<{
    success: boolean;
    data: AdminJob[];
    pagination: { total: number; totalPages: number };
  }>(url);

  return {
    jobs: res.data.data,
    total: res.data.pagination.total,
    totalPages: res.data.pagination.totalPages,
  };
}

export async function retryJob(id: string): Promise<AdminJob> {
  const res = await apiClient.post<{ success: boolean; data: AdminJob }>(`/admin/jobs/${id}/retry`);
  return res.data.data;
}

export async function cancelJob(id: string): Promise<AdminJob> {
  const res = await apiClient.post<{ success: boolean; data: AdminJob }>(`/admin/jobs/${id}/cancel`);
  return res.data.data;
}

export async function approveJobPayment(id: string): Promise<AdminJob> {
  const res = await apiClient.post<{ success: boolean; data: AdminJob }>(`/admin/jobs/${id}/approve-payment`);
  return res.data.data;
}

// ==================== PAYMENTS & NOTIFICATIONS ====================

export async function getPaymentLogs(
  method = 'ALL',
  isMatched = 'ALL',
  page = 1,
  limit = 50
): Promise<{
  logs: PaymentLogItem[];
  total: number;
  totalPages: number;
}> {
  const res = await apiClient.get<{
    success: boolean;
    data: PaymentLogItem[];
    pagination: { total: number; totalPages: number };
  }>(`/admin/payments?method=${method}&isMatched=${isMatched}&page=${page}&limit=${limit}`);

  return {
    logs: res.data.data,
    total: res.data.pagination.total,
    totalPages: res.data.pagination.totalPages,
  };
}

export async function getNotificationLogs(page = 1, limit = 50): Promise<NotificationResponseData> {
  const res = await apiClient.get<{
    success: boolean;
    data: PaymentLogItem[];
    webhookConfig: { endpointUrl: string; webhookSecret: string; toleranceMinutes: number };
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>(`/admin/notifications?page=${page}&limit=${limit}`);

  return res.data;
}

export async function testBankWebhookSimulator(payload: {
  amount: number;
  bank?: string;
  rawText?: string;
}): Promise<{
  success: boolean;
  message: string;
  data: { matched: boolean; jobId?: string; orderCode?: string };
}> {
  const res = await apiClient.post<{
    success: boolean;
    message: string;
    data: { matched: boolean; jobId?: string; orderCode?: string };
  }>('/admin/notifications/test', payload);

  return res.data;
}

// ==================== PRINT AGENT ====================

export async function getAgentStatus(): Promise<AgentStatusInfo> {
  const res = await apiClient.get<{ success: boolean; data: AgentStatusInfo }>('/admin/agent');
  return res.data.data;
}

export async function setAgentMode(mode: 'SIMULATION' | 'SUMATRA'): Promise<{ mode: string }> {
  const res = await apiClient.post<{ success: boolean; data: { mode: string } }>('/admin/agent/mode', { mode });
  return res.data.data;
}

export async function triggerAgentTestPrint(params?: {
  printerName?: string;
  paperSize?: string;
  isColor?: boolean;
  trayNumber?: number;
}): Promise<{ success: boolean; message: string }> {
  const res = await apiClient.post<{ success: boolean; message: string }>('/admin/agent/test-print', params || {});
  return res.data;
}

// ==================== SYSTEM CONFIG ====================

export async function getSystemConfigs(): Promise<{
  configs: SystemConfigItem[];
  environment: EnvironmentSummary;
}> {
  const res = await apiClient.get<{
    success: boolean;
    data: SystemConfigItem[];
    environment: EnvironmentSummary;
  }>('/admin/config');

  return {
    configs: res.data.data,
    environment: res.data.environment,
  };
}

export async function upsertSystemConfig(payload: {
  key: string;
  value: string;
  description?: string;
}): Promise<SystemConfigItem> {
  const res = await apiClient.post<{ success: boolean; data: SystemConfigItem }>('/admin/config', payload);
  return res.data.data;
}

export async function deleteSystemConfig(key: string): Promise<void> {
  await apiClient.delete(`/admin/config/${key}`);
}

// ==================== STATS ====================

export async function getStats(): Promise<AdminStats> {
  const res = await apiClient.get<{ success: boolean; data: AdminStats }>('/admin/stats');
  return res.data.data;
}
