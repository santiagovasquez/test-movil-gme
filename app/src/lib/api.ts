import { API_URL } from '../config';
import { Alert, PositionUpdate, Session, Vehicle } from './types';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}, accessToken?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(response.status, body.message ?? `Error ${response.status}`);
  }
  return body as T;
}

export function login(email: string, password: string): Promise<Session> {
  return request<Session>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function fetchVehicles(accessToken: string) {
  return request<{ items: Vehicle[] }>('/vehicles', {}, accessToken);
}

export function fetchPositions(accessToken: string, since: number) {
  return request<{ cursor: number; updates: PositionUpdate[] }>(
    `/positions?since=${since}`,
    {},
    accessToken,
  );
}

export function fetchAlerts(accessToken: string, vehicleId?: string) {
  const query = vehicleId ? `?vehicleId=${encodeURIComponent(vehicleId)}` : '';
  return request<{ items: Alert[] }>(`/alerts${query}`, {}, accessToken);
}

export function markAlertRead(accessToken: string, alertId: string) {
  return request<Alert>(`/alerts/${encodeURIComponent(alertId)}/read`, { method: 'POST' }, accessToken);
}
