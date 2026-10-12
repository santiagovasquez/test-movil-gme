import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Api, authApi, createApi } from '../lib/api';
import { createHttpClient } from '../lib/http';
import { createSessionManager } from '../lib/session';
import { User } from '../lib/types';
import { secureTokenStorage } from '../storage/tokenStorage';

const EXPIRED_NOTICE = 'Tu sesión expiró. Inicia sesión de nuevo.';

type Status = 'restoring' | 'signedOut' | 'signedIn';

interface SessionContextValue {
  status: Status;
  user: User | null;
  notice: string | null;
  api: Api;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function createServices() {
  const session = createSessionManager({ storage: secureTokenStorage, auth: authApi });
  const api = createApi(createHttpClient({ session }));
  return { session, api };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [{ session, api }] = useState(createServices);
  const [status, setStatus] = useState<Status>('restoring');
  const [user, setUser] = useState<User | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    session.restore().then((restored) => {
      if (!active) return;
      setUser(restored);
      setStatus(restored ? 'signedIn' : 'signedOut');
    });
    const unsubscribe = session.onExpired(() => {
      setUser(null);
      setStatus('signedOut');
      setNotice(EXPIRED_NOTICE);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [session]);

  async function login(email: string, password: string) {
    const loggedIn = await session.login(email, password);
    setNotice(null);
    setUser(loggedIn);
    setStatus('signedIn');
  }

  async function logout() {
    await session.logout();
    setNotice(null);
    setUser(null);
    setStatus('signedOut');
  }

  return (
    <SessionContext.Provider value={{ status, user, notice, api, login, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession debe usarse dentro de SessionProvider');
  return value;
}
