export interface ServerToClientEvents {
  'payment:confirmed': (data: {
    jobId: string;
    orderCode: string;
    status: string;
    confirmedAt: string;
    message: string;
  }) => void;
  'job:status_changed': (data: {
    jobId: string;
    orderCode?: string;
    status: string;
    printedPages?: number;
    error?: string;
    message?: string;
  }) => void;
  'job:expired': (data: { jobId: string; message: string }) => void;
  'agent:new_job': (data: {
    jobId: string;
    orderCode: string;
    downloadToken: string;
    printSettings: {
      paperSize: string;
      isColor: boolean;
      isDuplex: boolean;
      duplexEdge: string;
      trayNumber: number;
      copies: number;
      pageRange: string;
    };
  }) => void;
}

export interface ClientToServerEvents {
  'join:job': (jobId: string) => void;
  'join:admin': () => void;
  'join:agent': () => void;
  'agent:heartbeat': (data: { printerStatus: string; timestamp: string }) => void;
  'agent:job_progress': (data: { jobId: string; currentProgress: number; totalPages: number }) => void;
}
