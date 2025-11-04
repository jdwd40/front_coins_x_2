import { apiClient, apiCall } from '@/lib/api-client';
import { transactionsResponseSchema } from '../schemas';

export const transactionsApi = {
  getTransactions: (userId: number, page = 1, limit = 20) => {
    return apiCall(
      () => apiClient.get(`/api/transactions/${userId}`, { params: { page, limit } }),
      transactionsResponseSchema
    );
  },
};

