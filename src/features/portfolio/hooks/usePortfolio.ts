import { useQuery } from '@tanstack/react-query';
import { portfolioApi } from '../api';
import { useAuthStore } from '@/features/auth/store';

export const portfolioKeys = {
  all: ['portfolio'] as const,
  detail: (userId: number) => [...portfolioKeys.all, userId] as const,
};

export function usePortfolio() {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: portfolioKeys.detail(user?.user_id || 0),
    queryFn: () => portfolioApi.getPortfolio(user!.user_id),
    select: (data) => data.success ? data.data : null,
    enabled: !!user,
  });
}

