import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, createHttpClient, request } from './http';
import { SessionExpiredError } from './session';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function mockFetch(...responses: Array<Response | Error>) {
  const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => {
    const next = responses.shift();
    if (!next || next instanceof Error) throw next ?? new Error('sin respuesta');
    return next;
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const authHeader = (init?: RequestInit) => (init?.headers as Record<string, string>).Authorization;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('request', () => {
  it('devuelve el JSON de la respuesta', async () => {
    mockFetch(json(200, { items: [] }));
    expect(await request('/vehicles')).toEqual({ items: [] });
  });

  it('convierte un error HTTP en ApiError con el mensaje del servidor', async () => {
    mockFetch(json(401, { message: 'Correo o contraseña incorrectos' }));
    await expect(request('/auth/login')).rejects.toMatchObject({
      status: 401,
      message: 'Correo o contraseña incorrectos',
    });
  });

  it('sin red lanza ApiError con status 0', async () => {
    mockFetch(new TypeError('Network request failed'));
    await expect(request('/vehicles')).rejects.toMatchObject({ status: 0 });
  });

  it('cancela la petición al vencer el timeout', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
          }),
      ),
    );
    const pending = request('/positions?since=0', {}, 5_000);
    const assertion = expect(pending).rejects.toMatchObject({ status: 0 });
    await vi.advanceTimersByTimeAsync(5_000);
    await assertion;
  });

  it('si el timeout corta la lectura del cuerpo lanza ApiError con status 0', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init?: RequestInit) => ({
        ok: true,
        status: 200,
        json: () =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
          }),
      })),
    );
    const pending = request('/positions?since=0', {}, 5_000);
    const assertion = expect(pending).rejects.toMatchObject({ status: 0 });
    await vi.advanceTimersByTimeAsync(5_000);
    await assertion;
  });
});

describe('createHttpClient', () => {
  const session = () => ({
    getAccessToken: vi.fn(async () => 'access-1'),
    refreshAfterReject: vi.fn(async (_rejected: string) => 'access-2'),
  });

  it('envía el access token como Bearer', async () => {
    const fetchMock = mockFetch(json(200, { items: [] }));
    await createHttpClient({ session: session() }).get('/vehicles');
    expect(authHeader(fetchMock.mock.calls[0][1])).toBe('Bearer access-1');
  });

  it('ante un 401 renueva el token y reintenta una vez', async () => {
    const fetchMock = mockFetch(json(401, {}), json(200, { items: [] }));
    const s = session();
    expect(await createHttpClient({ session: s }).get('/vehicles')).toEqual({ items: [] });
    expect(s.refreshAfterReject).toHaveBeenCalledWith('access-1');
    expect(authHeader(fetchMock.mock.calls[1][1])).toBe('Bearer access-2');
  });

  it('si el reintento también da 401 lanza el error', async () => {
    mockFetch(json(401, {}), json(401, {}));
    const s = session();
    await expect(createHttpClient({ session: s }).get('/vehicles')).rejects.toBeInstanceOf(ApiError);
    expect(s.refreshAfterReject).toHaveBeenCalledTimes(1);
  });

  it('si la sesión expiró al renovar, propaga SessionExpiredError', async () => {
    mockFetch(json(401, {}));
    const s = session();
    s.refreshAfterReject.mockRejectedValueOnce(new SessionExpiredError());
    await expect(createHttpClient({ session: s }).get('/vehicles')).rejects.toBeInstanceOf(
      SessionExpiredError,
    );
  });

  it('no reintenta errores distintos de 401', async () => {
    const fetchMock = mockFetch(json(503, { message: 'Intenta de nuevo' }));
    const s = session();
    await expect(createHttpClient({ session: s }).get('/positions?since=0')).rejects.toMatchObject({ status: 503 });
    expect(s.refreshAfterReject).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
