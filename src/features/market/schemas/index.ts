import { z } from 'zod';

export const timeRangeSchema = z.enum(['10M', '30M', '1H', '2H', '12H', '24H', 'ALL']);
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

export type TimeRange = z.infer<typeof timeRangeSchema>;
export type MarketTrend = z.infer<typeof marketTrendSchema>;
export type MarketHistoryResponse = z.infer<typeof marketHistoryResponseSchema>;

