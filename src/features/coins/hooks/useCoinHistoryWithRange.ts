import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { coinsApi } from '../api';
import { coinKeys } from './useCoins';
import type { TimeRange } from '@/shared/types/chart';
import type { PriceHistoryPoint } from '@/shared/types/chart';
import { MARKET_POLL_INTERVAL } from '@/lib/constants';

// Time range to API limit mapping
// Note: API maximum limit is 100, so we cap at 100 and rely on client-side sampling
const TIME_RANGE_LIMITS: Record<TimeRange, number> = {
  '10M': 10,
  '30M': 30,
  '1H': 60,
  '2H': 100, // Capped at API max
  '12H': 100, // Capped at API max
  '24H': 100, // Capped at API max
  'ALL': 100, // Capped at API max - fetch max available, sample client-side
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
  console.log('[enrichWithPriceChanges] Input data:', data);
  console.log('[enrichWithPriceChanges] Input data length:', data.length);
  
  if (!data || data.length === 0) {
    console.warn('[enrichWithPriceChanges] Empty or invalid data array');
    return [];
  }

  return data.map((item, index) => {
    if (!item) {
      console.warn(`[enrichWithPriceChanges] Invalid item at index ${index}:`, item);
      return null as any;
    }

    const price = typeof item.price === 'number' ? item.price : parseFloat(String(item.price));
    if (isNaN(price)) {
      console.error(`[enrichWithPriceChanges] Invalid price at index ${index}:`, item.price);
    }

    // Use created_at as timestamp (API returns created_at, not timestamp)
    const timestamp = item.created_at || item.timestamp;
    if (!timestamp) {
      console.error(`[enrichWithPriceChanges] Missing timestamp at index ${index}:`, item);
    }

    const previousPrice = index > 0 
      ? (typeof data[index - 1]?.price === 'number' 
          ? data[index - 1].price 
          : parseFloat(String(data[index - 1]?.price)))
      : undefined;

    const priceChange = previousPrice !== undefined && !isNaN(previousPrice) 
      ? price - previousPrice 
      : undefined;
    const priceChangePercent = previousPrice !== undefined && previousPrice !== 0 && !isNaN(previousPrice)
      ? ((price - previousPrice) / previousPrice) * 100
      : undefined;

    const result = {
      timestamp: timestamp,
      value: price,
      price,
      label: new Date(timestamp).toLocaleString('en-GB'),
      previousValue: previousPrice,
      priceChange,
      priceChangePercent,
    };

    if (index === 0) {
      console.log('[enrichWithPriceChanges] First enriched item:', result);
    }

    return result;
  }).filter(Boolean) as PriceHistoryPoint[];
}

export function useCoinHistoryWithRange(
  coinId: number,
  timeRange: TimeRange
) {
  // Cap limit at API maximum (100) to avoid validation errors
  const requestedLimit = TIME_RANGE_LIMITS[timeRange];
  const limit = Math.min(requestedLimit, 100);

  const query = useQuery({
    queryKey: coinKeys.historyByRange(coinId, timeRange),
    queryFn: async () => {
      console.log('[useCoinHistoryWithRange] Fetching history:', { 
        coinId, 
        timeRange, 
        requestedLimit,
        limit,
        coinIdValid: !!coinId,
        coinIdType: typeof coinId,
        coinIdValue: coinId
      });
      
      if (!coinId || coinId === 0) {
        console.error('[useCoinHistoryWithRange] Invalid coinId:', coinId);
        throw new Error(`Invalid coin ID: ${coinId}`);
      }
      
      // Validate limit is within API constraints (1-100)
      if (limit < 1 || limit > 100) {
        console.error('[useCoinHistoryWithRange] Invalid limit:', limit);
        throw new Error(`Limit must be between 1 and 100, got: ${limit}`);
      }
      
      const result = await coinsApi.getHistory(coinId, 1, limit);
      console.log('[useCoinHistoryWithRange] API result:', result);
      console.log('[useCoinHistoryWithRange] Full API URL would be:', `/api-2/api/coins/${coinId}/price-history?page=1&limit=${limit}`);
      
      // Throw error if API call failed so React Query treats it as an error
      if (!result.success) {
        console.error('[useCoinHistoryWithRange] API call failed:', {
          error: result.error,
          errorType: result.error.type,
          errorMessage: result.error.message,
          coinId,
          url: `/api-2/api/coins/${coinId}/price-history?page=1&limit=${limit}`
        });
        
        // Provide more helpful error message
        if (result.error.type === 'not-found') {
          throw new Error(`Coin history not found for coin ID ${coinId}. The endpoint may not exist or the coin may not have history data.`);
        }
        throw new Error(result.error.message || 'Failed to fetch coin history');
      }
      
      return result.data;
    },
    enabled: !!coinId && coinId !== 0,
    refetchInterval: MARKET_POLL_INTERVAL, // 30s polling
  });

  // Transform and sample data
  const processedData = useMemo(() => {
    console.log('[useCoinHistoryWithRange] Processing data - query.data:', query.data);
    console.log('[useCoinHistoryWithRange] Query state:', { 
      isLoading: query.isLoading, 
      isError: query.isError, 
      error: query.error,
      dataExists: !!query.data,
      historyExists: !!query.data?.history,
      historyLength: query.data?.history?.length 
    });

    // If query hasn't loaded yet or is in error state, return empty array
    if (query.isLoading || query.isError) {
      console.log('[useCoinHistoryWithRange] Query not ready:', { isLoading: query.isLoading, isError: query.isError });
      return [];
    }

    // If no data, return empty array
    if (!query.data) {
      console.log('[useCoinHistoryWithRange] No query data');
      return [];
    }

    // If no data array, return empty array
    if (!query.data.data || !Array.isArray(query.data.data)) {
      console.log('[useCoinHistoryWithRange] No data array:', query.data);
      return [];
    }

    console.log('[useCoinHistoryWithRange] History data:', query.data.data);
    console.log('[useCoinHistoryWithRange] First item sample:', query.data.data[0]);

    try {
      // Enrich with price change calculations
      const enriched = enrichWithPriceChanges(query.data.data);
      console.log('[useCoinHistoryWithRange] Enriched data:', enriched);
      console.log('[useCoinHistoryWithRange] Enriched first item:', enriched[0]);

      // Apply sampling for large datasets (>1000 points)
      const sampled = sampleData(enriched, 1000);
      console.log('[useCoinHistoryWithRange] Sampled data length:', sampled.length);

      return sampled;
    } catch (error) {
      console.error('[useCoinHistoryWithRange] Error processing data:', error);
      return [];
    }
  }, [query.data, query.isLoading, query.isError, query.error]);

  console.log('[useCoinHistoryWithRange] Returning:', {
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    dataLength: processedData.length,
  });

  return {
    ...query,
    data: processedData,
  };
}
