import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TOKEN_KEY, TOKEN_EXPIRY_KEY } from '@/lib/constants';
import type { User } from '../schemas';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  setAuth: (user: User, token: string) => void;
  logout: () => void;
  checkTokenExpiry: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        const expiryTime = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
        set({ user: null, token: null, isAuthenticated: false });
      },

      checkTokenExpiry: () => {
        const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
        if (!expiryTime) return false;

        const isValid = Date.now() < parseInt(expiryTime, 10);
        if (!isValid) {
          get().logout();
        }
        return isValid;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Listen for logout event from interceptor
window.addEventListener('auth:logout', () => {
  useAuthStore.getState().logout();
});

