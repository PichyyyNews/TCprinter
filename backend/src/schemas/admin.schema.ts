import { z } from 'zod';

export const createPrinterSchema = z.object({
  name: z.string().min(1, 'Printer name is required'),
  driverName: z.string().min(1, 'Driver name is required'),
  connectionType: z.enum(['USB', 'LAN', 'VIRTUAL', 'LOCAL']).default('USB'),
  status: z.enum(['ONLINE', 'OFFLINE', 'ERROR']).default('ONLINE'),
});

export const updatePrinterSchema = z.object({
  name: z.string().min(1).optional(),
  driverName: z.string().min(1).optional(),
  connectionType: z.enum(['USB', 'LAN', 'VIRTUAL', 'LOCAL']).optional(),
  status: z.enum(['ONLINE', 'OFFLINE', 'ERROR']).optional(),
  totalSheetsPrinted: z.number().int().min(0).optional(),
});

export const createTraySchema = z.object({
  printerId: z.string().min(1, 'Printer ID is required'),
  trayNumber: z.number().int().min(1, 'Tray number must be at least 1'),
  paperSize: z.string().min(1).default('A4'),
  colorCapability: z.enum(['MONOCHROME', 'COLOR', 'ANY']).default('ANY'),
  isActive: z.boolean().default(true),
  status: z.enum(['OK', 'OUT_OF_PAPER', 'PAPER_JAM', 'DISABLED']).default('OK'),
  paperRemaining: z.number().int().min(0).max(10000).default(500),
});

export const updateTraySchema = z.object({
  printerId: z.string().optional(),
  trayNumber: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
  paperRemaining: z.number().int().min(0).max(10000).optional(),
  status: z.enum(['OK', 'OUT_OF_PAPER', 'PAPER_JAM', 'DISABLED']).optional(),
  paperSize: z.string().optional(),
  colorCapability: z.enum(['MONOCHROME', 'COLOR', 'ANY']).optional(),
});

export const createPricingSchema = z.object({
  paperSize: z.string().min(1, 'Paper size is required'),
  isColor: z.boolean().default(false),
  isDuplex: z.boolean().default(false),
  pricePerPage: z.number().positive('Price per page must be positive'),
  isActive: z.boolean().default(true),
});

export const updatePricingSchema = z.object({
  pricePerPage: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

export const createConfigSchema = z.object({
  key: z.string().min(1, 'Config key is required'),
  value: z.string(),
  description: z.string().optional(),
});

export const updateConfigSchema = z.object({
  value: z.string(),
  description: z.string().optional(),
});

export const testNotificationSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  bank: z.string().default('KBANK'),
  rawText: z.string().optional(),
});

export const testPrintSchema = z.object({
  printerName: z.string().optional(),
  trayNumber: z.number().int().min(1).optional(),
  paperSize: z.string().default('A4'),
  isColor: z.boolean().default(false),
});

export const agentModeSchema = z.object({
  mode: z.enum(['SIMULATION', 'SUMATRA']),
});

export type CreatePrinterSchemaType = z.infer<typeof createPrinterSchema>;
export type UpdatePrinterSchemaType = z.infer<typeof updatePrinterSchema>;
export type CreateTraySchemaType = z.infer<typeof createTraySchema>;
export type UpdateTraySchemaType = z.infer<typeof updateTraySchema>;
export type CreatePricingSchemaType = z.infer<typeof createPricingSchema>;
export type UpdatePricingSchemaType = z.infer<typeof updatePricingSchema>;
export type CreateConfigSchemaType = z.infer<typeof createConfigSchema>;
export type UpdateConfigSchemaType = z.infer<typeof updateConfigSchema>;
