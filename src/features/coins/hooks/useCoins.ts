import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { coinsApi } from '../api';
import type { UpdatePriceInput } from '../schemas';
import type { TimeRange } from '@/shared/types/chart';

export const coinKeys = {
  all: ['coins'] as const,
  lists: () => [...coinKeys.all, 'list'] as const,
  details: () => [...coinKeys.all, 'detail'] as const,
  detail: (id: number) => [...coinKeys.details(), id] as const,
  history: (id: number, page: number, limit: number) =>
    [...coinKeys.detail(id), 'history', page, limit] as const,
  // NEW: Time range aware history key
  historyByRange: (id: number, timeRange: TimeRange) =>
    [...coinKeys.detail(id), 'history', 'range', timeRange] as const,
};

export function useCoins() {
  return useQuery({
    queryKey: coinKeys.lists(),
    queryFn: coinsApi.getAll,
    select: (data) => data.success ? data.data.coins : [],
  });
}

export function useCoin(id: number) {
  return useQuery({
    queryKey: coinKeys.detail(id),
    queryFn: () => coinsApi.getById(id),
    select: (data) => data.success ? data.data.coin : null,
    enabled: !!id,
  });
}

export function useCoinHistory(id: number, page = 1, limit = 50) {
  return useQuery({
    queryKey: coinKeys.history(id, page, limit),
    queryFn: () => coinsApi.getHistory(id, page, limit),
    select: (data) => data.success ? data.data : null,
    enabled: !!id,
  });
}

export function useUpdateCoinPrice(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePriceInput) => coinsApi.updatePrice(id, data),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Price updated successfully');
        queryClient.invalidateQueries({ queryKey: coinKeys.detail(id) });
        queryClient.invalidateQueries({ queryKey: coinKeys.lists() });
      } else {
        toast.error(result.error.message);
      }
    },
  });
}

// Prefetch helper for hover interactions
export function usePrefetchCoin() {
  const queryClient = useQueryClient();

  return (id: number) => {
    queryClient.prefetchQuery({
      queryKey: coinKeys.detail(id),
      queryFn: () => coinsApi.getById(id),
    });
  };
}

