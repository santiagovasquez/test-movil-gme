import type { StoredSession, TokenStorage } from '@app/lib/session';

const KEY = 'gme-flota.session';

/** Adaptador web: la única pieza de sesión que cambia respecto a la app (SecureStore). */
export const localTokenStorage: TokenStorage = {
  async load() {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  },
  async save(session) {
    localStorage.setItem(KEY, JSON.stringify(session));
  },
  async clear() {
    localStorage.removeItem(KEY);
  },
};
