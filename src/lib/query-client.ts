import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import axios from 'axios';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: true,
    },
    mutations: {
      onError: (error) => {
        if (axios.isAxiosError(error)) {
          toast.error(error.response?.data?.msg || 'Operation failed');
        }
      },
    },
  },
});

