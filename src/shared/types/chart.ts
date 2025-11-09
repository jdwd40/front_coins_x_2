import { z } from 'zod';

export const timeRangeSchema = z.enum(['10M', '30M', '1H', '2H', '12H', '24H', 'ALL']);
export type TimeRange = z.infer<typeof timeRangeSchema>;

export interface ChartDataPoint {
  timestamp: string | number;
  value: number;
  label: string;
  previousValue?: number; // For calculating change %
}

export interface PriceHistoryPoint extends ChartDataPoint {
  price: number;
  priceChange?: number; // Change from previous point
  priceChangePercent?: number; // % change from previous point
}
