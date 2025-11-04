import axios, { AxiosError } from 'axios';
import { z } from 'zod';
import { API_BASE_URL, TOKEN_KEY } from './constants';

// Error types with discriminated unions
export type ApiError =
  | { type: 'network'; message: string }
  | { type: 'validation'; message: string; errors?: Record<string, string[]> }
  | { type: 'unauthorized'; message: string }
  | { type: 'not-found'; message: string }
  | { type: 'server'; message: string; statusCode: number };

export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };

// Axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - add JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
    return Promise.reject(error);
  }
);

// Generic API call wrapper with Zod validation
export async function apiCall<T>(
  apiFunction: () => Promise<{ data: unknown }>,
  schema: z.ZodSchema<T>
): Promise<ApiResult<T>> {
  try {
    const response = await apiFunction();
    const validated = schema.safeParse(response.data);

    if (!validated.success) {
      console.error('Validation error:', validated.error);
      return {
        success: false,
        error: { type: 'validation', message: 'Invalid response from server' }
      };
    }

    return { success: true, data: validated.data };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.msg || error.message;

      if (!error.response) {
        return { success: false, error: { type: 'network', message: 'Network error' } };
      }
      if (status === 401) {
        return { success: false, error: { type: 'unauthorized', message } };
      }
      if (status === 404) {
        return { success: false, error: { type: 'not-found', message } };
      }
      if (status && status >= 500) {
        return { success: false, error: { type: 'server', message, statusCode: status } };
      }
      return { success: false, error: { type: 'validation', message } };
    }

    return {
      success: false,
      error: { type: 'server', message: 'Unknown error', statusCode: 500 }
    };
  }
}

