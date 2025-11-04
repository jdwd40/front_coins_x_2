// Use relative path in development (Vite proxy handles it)
// Use full URL in production
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api-2';
export const TOKEN_KEY = 'coins_auth_token';
export const TOKEN_EXPIRY_KEY = 'coins_token_expiry';
export const QUERY_STALE_TIME = 30_000; // 30 seconds
export const MARKET_POLL_INTERVAL = 30_000; // 30 seconds

