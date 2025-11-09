import { z } from 'zod';
import { timeRangeSchema } from '@/shared/types/chart';

// Re-export TimeRange from shared
export type { TimeRange } from '@/shared/types/chart';
export { timeRangeSchema };

export const marketTrendSchema = z.enum(['UP', 'DOWN', 'STABLE', 'MILD_BOOM', 'STRONG_BOOM', 'MILD_BUST', 'STRONG_BUST']);

export const marketHistoryItemSchema = z.object({
  total_value: z.string(), // IMPORTANT: API returns as string!
  market_trend: marketTrendSchema,
  created_at: z.string(),
  timestamp: z.coerce.number(),
});

export const marketHistoryResponseSchema = z.object({
  history: z.array(marketHistoryItemSchema),
  timeRange: timeRangeSchema,
  count: z.number(),
});

export type MarketTrend = z.infer<typeof marketTrendSchema>;
export type MarketHistoryResponse = z.infer<typeof marketHistoryResponseSchema>;

