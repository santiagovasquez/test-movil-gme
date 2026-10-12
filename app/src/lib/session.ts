import { ApiError } from './http';
import { LoginResponse, TokenResponse, User } from './types';

/** Renueva el access token cuando le quedan menos de este margen. */
const REFRESH_MARGIN_MS = 10_000;

export interface StoredSession {
  refreshToken: string;
  user: User;
}

export interface TokenStorage {
  load(): Promise<StoredSession | null>;
  save(session: StoredSession): Promise<void>;
  clear(): Promise<void>;
}

export interface AuthApi {
  login(email: string, password: string): Promise<LoginResponse>;
  refresh(refreshToken: string): Promise<TokenResponse>;
}

export class SessionExpiredError extends Error {
  constructor() {
    super('La sesión expiró');
    this.name = 'SessionExpiredError';
  }
}

export type SessionManager = ReturnType<typeof createSessionManager>;

interface Deps {
  storage: TokenStorage;
  auth: AuthApi;
  now?: () => number;
}

export function createSessionManager({ storage, auth, now = Date.now }: Deps) {
  let accessToken: string | null = null;
  let expiresAt = 0;
  let stored: StoredSession | null = null;
  let refreshing: Promise<string> | null = null;
  const expiredListeners = new Set<() => void>();

  const hasValidToken = () => accessToken !== null && now() < expiresAt - REFRESH_MARGIN_MS;

  async function applyTokens(tokens: TokenResponse, user: User): Promise<string> {
    accessToken = tokens.accessToken;
    expiresAt = now() + tokens.expiresIn * 1000;
    stored = { refreshToken: tokens.refreshToken, user };
    // El refresh token anterior ya no sirve: si no se puede guardar, la sesión
    // sigue viva en memoria y se intenta guardar de nuevo en el próximo refresh.
    await storage.save(stored).catch(() => undefined);
    return tokens.accessToken;
  }

  async function clear() {
    accessToken = null;
    expiresAt = 0;
    stored = null;
    await storage.clear().catch(() => undefined);
  }

  async function runRefresh(): Promise<string> {
    const current = stored;
    if (!current) throw new SessionExpiredError();
    try {
      const tokens = await auth.refresh(current.refreshToken);
      if (stored !== current) throw new SessionExpiredError(); // logout durante el refresh
      return await applyTokens(tokens, current.user);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await clear();
        expiredListeners.forEach((listener) => listener());
        throw new SessionExpiredError();
      }
      throw error;
    }
  }

  /** Un solo refresh en curso: quienes llegan mientras tanto esperan el mismo resultado. */
  function refresh(): Promise<string> {
    refreshing ??= runRefresh().finally(() => {
      refreshing = null;
    });
    return refreshing;
  }

  return {
    async restore(): Promise<User | null> {
      stored = await storage.load().catch(() => null);
      if (!stored) return null;
      try {
        await refresh();
      } catch (error) {
        if (error instanceof SessionExpiredError) return null;
        // Sin red: entra con el usuario guardado y renueva en la siguiente petición.
      }
      return stored?.user ?? null;
    },

    async login(email: string, password: string): Promise<User> {
      const response = await auth.login(email, password);
      await applyTokens(response, response.user);
      return response.user;
    },

    logout: clear,

    getAccessToken(): Promise<string> {
      return hasValidToken() ? Promise.resolve(accessToken!) : refresh();
    },

    /** Token nuevo tras un 401; si otro ya lo renovó, devuelve el vigente sin refrescar. */
    refreshAfterReject(rejected: string): Promise<string> {
      return hasValidToken() && accessToken !== rejected ? Promise.resolve(accessToken!) : refresh();
    },

    onExpired(listener: () => void): () => void {
      expiredListeners.add(listener);
      return () => expiredListeners.delete(listener);
    },
  };
}
