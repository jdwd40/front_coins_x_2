import { apiClient, apiCall } from '@/lib/api-client';
import { marketHistoryResponseSchema, type TimeRange } from '../schemas';

export const marketApi = {
  getPriceHistory: (timeRange: TimeRange = '30M') => {
    return apiCall(
      () => apiClient.get('/api/market/price-history', { params: { timeRange } }),
      marketHistoryResponseSchema
    );
  },
};

