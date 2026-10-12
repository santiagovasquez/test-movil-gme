import { API_URL } from '../config';
import type { SessionManager } from './session';

const DEFAULT_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  /** `status` 0 significa sin respuesta del servidor (red caída o timeout). */
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  headers?: Record<string, string>;
}

/** Petición sin autenticación, con timeout. */
export async function request<T>(
  path: string,
  { method = 'GET', body, headers }: RequestOptions = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response: Response;
    try {
      response = await fetch(`${API_URL}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch {
      throw new ApiError(0, 'Sin conexión con el servidor');
    }
    const data = await response.json().catch(() => ({}));
    // El timeout también puede cortar la lectura del cuerpo: no devolver `{}` como éxito.
    if (controller.signal.aborted) throw new ApiError(0, 'Sin conexión con el servidor');
    if (!response.ok) {
      throw new ApiError(response.status, data.message ?? `Error ${response.status}`);
    }
    return data as T;
  } finally {
    clearTimeout(timer);
  }
}

export type HttpClient = ReturnType<typeof createHttpClient>;

interface Deps {
  session: Pick<SessionManager, 'getAccessToken' | 'refreshAfterReject'>;
  timeoutMs?: number;
}

/** Peticiones con Bearer; ante un 401 pide un token nuevo y reintenta una sola vez. */
export function createHttpClient({ session, timeoutMs = DEFAULT_TIMEOUT_MS }: Deps) {
  const withToken = (options: RequestOptions, token: string): RequestOptions => ({
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` },
  });

  async function authorized<T>(path: string, options: RequestOptions): Promise<T> {
    const token = await session.getAccessToken();
    try {
      return await request<T>(path, withToken(options, token), timeoutMs);
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) throw error;
      const fresh = await session.refreshAfterReject(token);
      return request<T>(path, withToken(options, fresh), timeoutMs);
    }
  }

  return {
    get: <T>(path: string) => authorized<T>(path, { method: 'GET' }),
    post: <T>(path: string, body?: unknown) => authorized<T>(path, { method: 'POST', body }),
  };
}
