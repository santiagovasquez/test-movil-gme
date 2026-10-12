import * as SecureStore from 'expo-secure-store';
import type { StoredSession, TokenStorage } from '../lib/session';

const KEY = 'gme-flota.session';

/** Refresh token y usuario en el almacenamiento seguro del dispositivo. */
export const secureTokenStorage: TokenStorage = {
  async load() {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredSession;
    } catch {
      return null;
    }
  },
  save: (session) => SecureStore.setItemAsync(KEY, JSON.stringify(session)),
  clear: () => SecureStore.deleteItemAsync(KEY),
};
