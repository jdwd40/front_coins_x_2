import { apiClient, apiCall } from '@/lib/api-client';
import { portfolioResponseSchema } from '../schemas';

export const portfolioApi = {
  getPortfolio: (userId: number) => {
    return apiCall(
      () => apiClient.get(`/api/portfolio/${userId}`),
      portfolioResponseSchema
    );
  },
};

