import { z } from 'zod';

export const webhookSchema = z.object({
  bank: z.string().optional(),
  amount: z.number().positive(),
  rawText: z.string().optional(),
  timestamp: z.string().optional(),
});

export const verifySlipSchema = z.object({
  jobId: z.string().uuid(),
});

export type WebhookSchemaType = z.infer<typeof webhookSchema>;
