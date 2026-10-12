import { HttpClient, request } from './http';
import type { AuthApi } from './session';
import { Alert, LoginResponse, PositionUpdate, TokenResponse, Vehicle } from './types';

export const authApi: AuthApi = {
  login: (email, password) =>
    request<LoginResponse>('/auth/login', { method: 'POST', body: { email, password } }),
  refresh: (refreshToken) =>
    request<TokenResponse>('/auth/refresh', { method: 'POST', body: { refreshToken } }),
};

export type Api = ReturnType<typeof createApi>;

export function createApi(http: HttpClient) {
  return {
    fetchVehicles: () => http.get<{ items: Vehicle[] }>('/vehicles'),

    fetchPositions: (since: number) =>
      http.get<{ cursor: number; updates: PositionUpdate[] }>(`/positions?since=${since}`),

    fetchAlerts: (vehicleId?: string) => {
      const query = vehicleId ? `?vehicleId=${encodeURIComponent(vehicleId)}` : '';
      return http.get<{ items: Alert[] }>(`/alerts${query}`);
    },

    markAlertRead: (alertId: string) =>
      http.post<Alert>(`/alerts/${encodeURIComponent(alertId)}/read`),
  };
}
