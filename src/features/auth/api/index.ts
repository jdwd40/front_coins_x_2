import { apiClient, apiCall } from '@/lib/api-client';
import { loginResponseSchema, type LoginInput, type RegisterInput } from '../schemas';

export const authApi = {
  register: async (data: RegisterInput) => {
    return apiCall(
      () => apiClient.post('/api/users/register', data),
      loginResponseSchema
    );
  },

  login: async (data: LoginInput) => {
    return apiCall(
      () => apiClient.post('/api/users/login', data),
      loginResponseSchema
    );
  },
};

