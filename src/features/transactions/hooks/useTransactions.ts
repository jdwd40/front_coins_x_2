import { useQuery } from '@tanstack/react-query';
import { transactionsApi } from '../api';
import { useAuthStore } from '@/features/auth/store';

export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (userId: number, page: number, limit: number) => 
    [...transactionKeys.lists(), userId, page, limit] as const,
};

export function useTransactions(page = 1, limit = 20) {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: transactionKeys.list(user?.user_id || 0, page, limit),
    queryFn: () => transactionsApi.getTransactions(user!.user_id, page, limit),
    select: (data) => data.success ? data.data : null,
    enabled: !!user,
  });
}

