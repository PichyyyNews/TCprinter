import { z } from 'zod';

export const createJobSchema = z.object({
  quoteId: z.string().uuid('Invalid quote ID format'),
  copies: z.number().int().min(1).max(99).default(1),
  pageRange: z.string().default('all'),
  paperSize: z.enum(['A4', 'A3']).default('A4'),
  isColor: z.boolean().default(false),
  isDuplex: z.boolean().default(false),
  duplexEdge: z.enum(['NONE', 'LONG_EDGE', 'SHORT_EDGE']).default('NONE'),
});

export type CreateJobSchemaType = z.infer<typeof createJobSchema>;
