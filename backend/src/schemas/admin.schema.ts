import { z } from 'zod';

export const updateTraySchema = z.object({
  isActive: z.boolean().optional(),
  paperRemaining: z.number().int().min(0).max(5000).optional(),
  status: z.enum(['OK', 'OUT_OF_PAPER', 'PAPER_JAM', 'DISABLED']).optional(),
  paperSize: z.string().optional(),
  colorCapability: z.enum(['MONOCHROME', 'COLOR', 'ANY']).optional(),
});

export const updatePricingSchema = z.object({
  pricePerPage: z.number().positive(),
  isActive: z.boolean().optional(),
});

export type UpdateTraySchemaType = z.infer<typeof updateTraySchema>;
