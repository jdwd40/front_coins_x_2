import { z } from 'zod';

export const holdingSchema = z.object({
  coin_id: z.number(),
  coin_name: z.string(),
  symbol: z.string(),
  quantity: z.number(),
  avg_buy_price: z.number(),
  current_price: z.number(),
  total_value: z.number(),
  profit_loss: z.number(),
  profit_loss_percentage: z.number(),
});

export const portfolioResponseSchema = z.object({
  holdings: z.array(holdingSchema),
  total_value: z.number(),
  total_invested: z.number(),
  total_profit_loss: z.number(),
  total_profit_loss_percentage: z.number(),
});

export type Holding = z.infer<typeof holdingSchema>;
export type PortfolioResponse = z.infer<typeof portfolioResponseSchema>;

