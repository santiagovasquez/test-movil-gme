import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './http';
import { AuthApi, createSessionManager, SessionExpiredError, StoredSession, TokenStorage } from './session';

const user = { name: 'Mariana Ospina', email: 'supervisor@gme.co' };

function setup(saved: StoredSession | null = null) {
  let clock = 0;
  let seq = 0;
  let data = saved;
  const storage = {
    get data() {
      return data;
    },
    load: vi.fn(async () => data),
    save: vi.fn(async (s: StoredSession) => {
      data = s;
    }),
    clear: vi.fn(async () => {
      data = null;
    }),
  } satisfies TokenStorage & { data: StoredSession | null };
  const tokens = () => {
    seq += 1;
    return { accessToken: `access-${seq}`, refreshToken: `refresh-${seq}`, expiresIn: 60 };
  };
  const auth = {
    login: vi.fn(async () => ({ ...tokens(), user })),
    refresh: vi.fn(async (_refreshToken: string) => tokens()),
  } satisfies AuthApi;
  const session = createSessionManager({ storage, auth, now: () => clock });
  const advance = (seconds: number) => {
    clock += seconds * 1000;
  };
  return { session, storage, auth, advance };
}

describe('createSessionManager', () => {
  it('usa el token vigente sin refrescar', async () => {
    const { session, auth, advance } = setup();
    await session.login('supervisor@gme.co', 'flota2026');
    advance(45);
    expect(await session.getAccessToken()).toBe('access-1');
    expect(auth.refresh).not.toHaveBeenCalled();
  });

  it('renueva cuando faltan menos de 10 s y guarda el refresh token nuevo', async () => {
    const { session, auth, storage, advance } = setup();
    await session.login('supervisor@gme.co', 'flota2026');
    advance(51);
    expect(await session.getAccessToken()).toBe('access-2');
    expect(auth.refresh).toHaveBeenCalledWith('refresh-1');
    expect(storage.data).toEqual({ refreshToken: 'refresh-2', user });
  });

  it('hace un solo refresh aunque varias peticiones lo pidan a la vez', async () => {
    const { session, auth, advance } = setup();
    await session.login('supervisor@gme.co', 'flota2026');
    advance(60);
    const results = await Promise.all([session.getAccessToken(), session.getAccessToken(), session.getAccessToken()]);
    expect(results).toEqual(['access-2', 'access-2', 'access-2']);
    expect(auth.refresh).toHaveBeenCalledTimes(1);
  });

  it('no refresca si el token rechazado ya fue reemplazado', async () => {
    const { session, auth } = setup();
    await session.login('supervisor@gme.co', 'flota2026');
    expect(await session.refreshAfterReject('access-1')).toBe('access-2');
    expect(await session.refreshAfterReject('access-1')).toBe('access-2');
    expect(auth.refresh).toHaveBeenCalledTimes(1);
  });

  it('con 401 en el refresh limpia la sesión y avisa que expiró', async () => {
    const { session, auth, storage, advance } = setup();
    const onExpired = vi.fn();
    session.onExpired(onExpired);
    await session.login('supervisor@gme.co', 'flota2026');
    auth.refresh.mockRejectedValueOnce(new ApiError(401, 'La sesión expiró'));
    advance(60);
    await expect(session.getAccessToken()).rejects.toBeInstanceOf(SessionExpiredError);
    expect(storage.data).toBeNull();
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it('con error de red en el refresh conserva la sesión y reintenta después', async () => {
    const { session, auth, storage, advance } = setup();
    const onExpired = vi.fn();
    session.onExpired(onExpired);
    await session.login('supervisor@gme.co', 'flota2026');
    auth.refresh.mockRejectedValueOnce(new ApiError(0, 'Sin conexión'));
    advance(60);
    await expect(session.getAccessToken()).rejects.toMatchObject({ status: 0 });
    expect(storage.data?.refreshToken).toBe('refresh-1');
    expect(onExpired).not.toHaveBeenCalled();
    expect(await session.getAccessToken()).toBe('access-2');
  });

  it('logout limpia la sesión sin avisar expiración', async () => {
    const { session, storage } = setup();
    const onExpired = vi.fn();
    session.onExpired(onExpired);
    await session.login('supervisor@gme.co', 'flota2026');
    await session.logout();
    expect(storage.data).toBeNull();
    expect(onExpired).not.toHaveBeenCalled();
    await expect(session.getAccessToken()).rejects.toBeInstanceOf(SessionExpiredError);
  });

  describe('restore', () => {
    const saved = { refreshToken: 'saved-refresh', user };

    it('devuelve null sin sesión guardada', async () => {
      const { session, auth } = setup();
      expect(await session.restore()).toBeNull();
      expect(auth.refresh).not.toHaveBeenCalled();
    });

    it('renueva la sesión guardada y devuelve el usuario', async () => {
      const { session, auth } = setup(saved);
      expect(await session.restore()).toEqual(user);
      expect(auth.refresh).toHaveBeenCalledWith('saved-refresh');
      expect(await session.getAccessToken()).toBe('access-1');
    });

    it('devuelve null si la sesión guardada expiró', async () => {
      const { session, auth } = setup(saved);
      auth.refresh.mockRejectedValueOnce(new ApiError(401, 'La sesión expiró'));
      expect(await session.restore()).toBeNull();
    });

    it('sin red entra con el usuario guardado', async () => {
      const { session, auth } = setup(saved);
      auth.refresh.mockRejectedValueOnce(new ApiError(0, 'Sin conexión'));
      expect(await session.restore()).toEqual(user);
    });
  });
});
