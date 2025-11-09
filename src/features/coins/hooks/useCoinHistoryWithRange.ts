import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { coinsApi } from '../api';
import { coinKeys } from './useCoins';
import type { TimeRange } from '@/shared/types/chart';
import type { PriceHistoryPoint } from '@/shared/types/chart';
import { MARKET_POLL_INTERVAL } from '@/lib/constants';

// Time range to API limit mapping
const TIME_RANGE_LIMITS: Record<TimeRange, number> = {
  '10M': 10,
  '30M': 30,
  '1H': 60,
  '2H': 120,
  '12H': 720,
  '24H': 1440,
  'ALL': 5000, // Fetch all, will sample client-side if needed
};

// NEW: Smart data sampling for performance
function sampleData(data: PriceHistoryPoint[], maxPoints: number = 1000): PriceHistoryPoint[] {
  if (data.length <= maxPoints) return data;

  const step = Math.ceil(data.length / maxPoints);
  const sampled: PriceHistoryPoint[] = [];

  for (let i = 0; i < data.length; i += step) {
    const point = data[i];
    if (point) sampled.push(point);
  }

  // Always include the last point
  const lastPoint = data[data.length - 1];
  if (lastPoint && sampled[sampled.length - 1] !== lastPoint) {
    sampled.push(lastPoint);
  }

  return sampled;
}

// NEW: Calculate price changes between points
function enrichWithPriceChanges(data: any[]): PriceHistoryPoint[] {
  return data.map((item, index) => {
    const price = parseFloat(item.price);
    const previousPrice = index > 0 ? parseFloat(data[index - 1].price) : undefined;

    const priceChange = previousPrice !== undefined ? price - previousPrice : undefined;
    const priceChangePercent = previousPrice !== undefined && previousPrice !== 0
      ? ((price - previousPrice) / previousPrice) * 100
      : undefined;

    return {
      timestamp: item.timestamp,
      value: price,
      price,
      label: new Date(item.timestamp).toLocaleString('en-GB'),
      previousValue: previousPrice,
      priceChange,
      priceChangePercent,
    };
  });
}

export function useCoinHistoryWithRange(
  coinId: number,
  timeRange: TimeRange
) {
  const limit = TIME_RANGE_LIMITS[timeRange];

  const query = useQuery({
    queryKey: coinKeys.historyByRange(coinId, timeRange),
    queryFn: () => coinsApi.getHistory(coinId, 1, limit),
    select: (data) => data.success ? data.data : null,
    enabled: !!coinId,
    refetchInterval: MARKET_POLL_INTERVAL, // 30s polling
  });

  // Transform and sample data
  const processedData = useMemo(() => {
    if (!query.data?.history) return [];

    // Enrich with price change calculations
    const enriched = enrichWithPriceChanges(query.data.history);

    // Apply sampling for large datasets (>1000 points)
    const sampled = sampleData(enriched, 1000);

    return sampled;
  }, [query.data]);

  return {
    ...query,
    data: processedData,
  };
}
