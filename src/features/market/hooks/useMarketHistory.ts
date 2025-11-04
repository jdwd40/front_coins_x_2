import { useQuery } from '@tanstack/react-query';
import { marketApi } from '../api';
import type { TimeRange } from '../schemas';
import { MARKET_POLL_INTERVAL } from '@/lib/constants';

export const marketKeys = {
  all: ['market'] as const,
  history: (timeRange: TimeRange) => [...marketKeys.all, 'history', timeRange] as const,
};

export function useMarketHistory(timeRange: TimeRange = '30M') {
  return useQuery({
    queryKey: marketKeys.history(timeRange),
    queryFn: () => marketApi.getPriceHistory(timeRange),
    select: (data) => data.success ? data.data : null,
    refetchInterval: MARKET_POLL_INTERVAL, // Poll every 30s
  });
}

