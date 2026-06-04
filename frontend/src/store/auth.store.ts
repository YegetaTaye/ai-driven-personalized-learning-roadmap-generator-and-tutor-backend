import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { configureInterceptors } from '@/api/client';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setAccessToken: (token: string, refreshToken: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken }),

      setAccessToken: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null });
        window.location.replace('/login');
      },

      isAuthenticated: () => Boolean(get().accessToken),
    }),
    { name: 'Yeneta-auth' },
  ),
);

// Wire Axios interceptors to the store (call once at app init)
configureInterceptors({
  getAccessToken: () => useAuthStore.getState().accessToken,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  onTokenRefreshed: (access, refresh) =>
    useAuthStore.getState().setAccessToken(access, refresh),
  onAuthFailure: () => useAuthStore.getState().logout(),
});
