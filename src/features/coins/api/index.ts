import { apiClient, apiCall } from '@/lib/api-client';
import {
  coinsResponseSchema,
  coinDetailSchema,
  coinHistoryResponseSchema,
  type UpdatePriceInput
} from '../schemas';

export const coinsApi = {
  getAll: () => apiCall(
    () => apiClient.get('/api/coins'),
    coinsResponseSchema
  ),

  getById: (id: number) => apiCall(
    () => apiClient.get(`/api/coins/${id}`),
    coinDetailSchema
  ),

  getHistory: (id: number, page = 1, limit = 50) => apiCall(
    () => apiClient.get(`/api/coins/${id}/history`, { params: { page, limit } }),
    coinHistoryResponseSchema
  ),

  updatePrice: (id: number, data: UpdatePriceInput) => apiCall(
    () => apiClient.patch(`/api/coins/${id}`, data),
    coinDetailSchema
  ),
};

