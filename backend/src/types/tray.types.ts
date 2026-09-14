export interface UpdateTrayInput {
  isActive?: boolean;
  paperRemaining?: number;
  status?: 'OK' | 'OUT_OF_PAPER' | 'PAPER_JAM' | 'DISABLED';
  paperSize?: string;
}
