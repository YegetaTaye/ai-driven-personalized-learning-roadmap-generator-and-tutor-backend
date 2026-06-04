import axios from 'axios';

// const localBaseURL = 'http://localhost:8000/api/v1';
// const productionBaseURL = 'https://api.yegna-future.site/api/v1';

export const apiClient = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL as string) ?? '/api/v1',  // Use relative URL for dev (proxy) and allow override in prod with env var
  // baseURL: productionBaseURL, // Override with env var if needed
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// Injected by auth store after init — avoids circular imports
let getAccessToken: (() => string | null) | null = null;
let getRefreshToken: (() => string | null) | null = null;
let onTokenRefreshed: ((access: string, refresh: string) => void) | null = null;
let onAuthFailure: (() => void) | null = null;

export function configureInterceptors(opts: {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  onTokenRefreshed: (access: string, refresh: string) => void;
  onAuthFailure: () => void;
}) {
  getAccessToken = opts.getAccessToken;
  getRefreshToken = opts.getRefreshToken;
  onTokenRefreshed = opts.onTokenRefreshed;
  onAuthFailure = opts.onAuthFailure;
}

// ── Request: inject Bearer token ─────────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken?.();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response: silent token refresh on 401 ────────────────────────────────────
let isRefreshing = false;
type QueueItem = { resolve: (t: string) => void; reject: (e: unknown) => void };
let failQueue: QueueItem[] = [];

apiClient.interceptors.response.use(
  (res) => res,
  async (error: import('axios').AxiosError) => {
    const original = error.config as import('axios').InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry || original.url?.includes('/auth/')) {
      return Promise.reject(error);
    }
    original._retry = true;

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      });
    }

    isRefreshing = true;
    try {
      const refreshToken = getRefreshToken?.();
      if (!refreshToken) throw new Error('No refresh token');
      const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
        `${apiClient.defaults.baseURL}/auth/refresh`,
        { refreshToken },
      );
      onTokenRefreshed?.(data.accessToken, data.refreshToken);
      failQueue.forEach((p) => p.resolve(data.accessToken));
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return apiClient(original);
    } catch (e) {
      failQueue.forEach((p) => p.reject(e));
      onAuthFailure?.();
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
      failQueue = [];
    }
  },
);
