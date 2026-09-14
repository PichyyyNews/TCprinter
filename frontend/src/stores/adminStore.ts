import { create } from 'zustand';
import { AdminTray, AdminJob, AdminStats, PricingRuleItem } from '../types/admin.types';

interface AdminState {
  trays: AdminTray[];
  jobs: AdminJob[];
  pricingRules: PricingRuleItem[];
  stats: AdminStats | null;
  isLoading: boolean;
  filterStatus: string;

  setTrays: (trays: AdminTray[]) => void;
  setJobs: (jobs: AdminJob[]) => void;
  setPricingRules: (rules: PricingRuleItem[]) => void;
  setStats: (stats: AdminStats | null) => void;
  setIsLoading: (loading: boolean) => void;
  setFilterStatus: (status: string) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  trays: [],
  jobs: [],
  pricingRules: [],
  stats: null,
  isLoading: false,
  filterStatus: 'ALL',

  setTrays: (trays) => set({ trays }),
  setJobs: (jobs) => set({ jobs }),
  setPricingRules: (pricingRules) => set({ pricingRules }),
  setStats: (stats) => set({ stats }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
}));
