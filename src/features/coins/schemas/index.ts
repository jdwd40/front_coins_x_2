import { z } from 'zod';

export const coinSchema = z.object({
  coin_id: z.number(),
  name: z.string(),
  symbol: z.string(),
  current_price: z.number(),
  market_cap: z.number(),
  circulating_supply: z.number(),
  price_change_24h: z.number(),
  founder: z.string(),
});

export const coinsResponseSchema = z.object({
  coins: z.array(coinSchema),
});

export const coinDetailSchema = z.object({
  coin: coinSchema,
});

export const priceHistoryItemSchema = z.object({
  price_history_id: z.number(),
  coin_id: z.number(),
  price: z.number(),
  created_at: z.string(),
  name: z.string(),
  symbol: z.string(),
});

export const coinHistoryResponseSchema = z.object({
  data: z.array(priceHistoryItemSchema),
  pagination: z.object({
    currentPage: z.number(),
    totalPages: z.number(),
    totalItems: z.number(),
    hasMore: z.boolean(),
  }),
});

export const updatePriceSchema = z.object({
  price: z.number()
    .min(0.01, 'Price must be at least 0.01')
    .max(1_000_000_000, 'Price too high'),
});

export type Coin = z.infer<typeof coinSchema>;
export type CoinsResponse = z.infer<typeof coinsResponseSchema>;
export type CoinHistory = z.infer<typeof coinHistoryResponseSchema>;
export type UpdatePriceInput = z.infer<typeof updatePriceSchema>;

