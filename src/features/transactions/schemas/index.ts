import { z } from 'zod';

export const transactionTypeSchema = z.enum(['BUY', 'SELL']);

export const transactionSchema = z.object({
  transaction_id: z.number(),
  user_id: z.number(),
  coin_id: z.number(),
  coin_name: z.string(),
  symbol: z.string(),
  transaction_type: transactionTypeSchema,
  quantity: z.number(),
  price_per_coin: z.number(),
  total_amount: z.number(),
  created_at: z.string(),
});

export const transactionsResponseSchema = z.object({
  transactions: z.array(transactionSchema),
  pagination: z.object({
    currentPage: z.number(),
    totalPages: z.number(),
    totalItems: z.number(),
    itemsPerPage: z.number(),
  }),
});

export type TransactionType = z.infer<typeof transactionTypeSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type TransactionsResponse = z.infer<typeof transactionsResponseSchema>;

