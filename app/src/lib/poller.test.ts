import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './http';
import { createPoller, createPositionsTask, NetworkStatus } from './poller';
import { SessionExpiredError } from './session';
import { PositionUpdate } from './types';

const INTERVAL = 3000;

const update = (i: number): PositionUpdate => ({
  vehicleId: 'veh-01',
  lat: 6.24,
  lng: -75.58,
  speedKmh: 30,
  heading: 90,
  recordedAt: new Date(1_700_000_000_000 + i * 1000).toISOString(),
});

const page = (cursor: number, count = 1) => ({
  cursor,
  updates: Array.from({ length: count }, (_, i) => update(cursor * 1000 + i)),
});

/** Promesa que se resuelve o rechaza desde el test. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function setup(fetchPositions: (since: number) => Promise<ReturnType<typeof page>>) {
  const fetchMock = vi.fn(fetchPositions);
  const onUpdates = vi.fn();
  const statuses: NetworkStatus[] = [];
  const poller = createPoller({
    task: createPositionsTask({ fetchPositions: fetchMock, onUpdates }),
    intervalMs: INTERVAL,
    onStatusChange: (s) => statuses.push(s),
  });
  return { poller, fetchMock, onUpdates, statuses };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('createPoller con posiciones', () => {
  it('empieza en since=0 y luego usa el cursor de la respuesta', async () => {
    let cursor = 0;
    const { poller, fetchMock } = setup(async () => page(++cursor * 10));

    poller.start();
    await vi.advanceTimersByTimeAsync(INTERVAL * 2);
    poller.stop();

    expect(fetchMock.mock.calls.map(([since]) => since)).toEqual([0, 10, 20]);
  });

  it('no consulta de nuevo mientras una consulta sigue en curso', async () => {
    const slow = deferred<ReturnType<typeof page>>();
    const { poller, fetchMock } = setup(() => slow.promise);

    poller.start();
    await vi.advanceTimersByTimeAsync(INTERVAL * 5);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    slow.resolve(page(5));
    await vi.advanceTimersByTimeAsync(INTERVAL);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    poller.stop();
  });

  it('un error conserva el cursor y reintenta en el siguiente intervalo', async () => {
    const responses = [
      () => Promise.resolve(page(10)),
      () => Promise.reject(new ApiError(503, 'Servicio no disponible')),
      () => Promise.resolve(page(20)),
    ];
    const { poller, fetchMock, statuses } = setup(() => responses.shift()!());

    poller.start();
    await vi.advanceTimersByTimeAsync(INTERVAL * 2);
    poller.stop();

    expect(fetchMock.mock.calls.map(([since]) => since)).toEqual([0, 10, 10]);
    expect(statuses).toEqual([]);
  });

  it('avisa "reconnecting" tras 3 fallos seguidos y vuelve a "ok" con el siguiente éxito', async () => {
    let calls = 0;
    const { poller, statuses } = setup(async () => {
      calls += 1;
      if (calls >= 2 && calls <= 4) throw new ApiError(0, 'Sin conexión');
      return page(10);
    });

    poller.start();
    await vi.advanceTimersByTimeAsync(INTERVAL * 2);
    expect(statuses).toEqual([]);
    await vi.advanceTimersByTimeAsync(INTERVAL);
    expect(statuses).toEqual(['reconnecting']);
    await vi.advanceTimersByTimeAsync(INTERVAL);
    poller.stop();

    expect(statuses).toEqual(['reconnecting', 'ok']);
  });

  it('poniéndose al día, un error reintenta rápido sin esperar el intervalo', async () => {
    const responses = [
      () => Promise.resolve(page(1, 200)),
      () => Promise.reject(new ApiError(503, 'Servicio no disponible')),
      () => Promise.resolve(page(2, 5)),
    ];
    const { poller, fetchMock } = setup(() => responses.shift()!());

    poller.start();
    await vi.advanceTimersByTimeAsync(400);
    poller.stop();

    expect(fetchMock.mock.calls.map(([since]) => since)).toEqual([0, 1, 1]);
  });

  it('sin respuesta todavía, reintenta rápido solo hasta el aviso y luego espera el intervalo', async () => {
    const { poller, fetchMock, statuses } = setup(async () => {
      throw new ApiError(0, 'Sin conexión');
    });

    poller.start();
    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(statuses).toEqual(['reconnecting']);

    await vi.advanceTimersByTimeAsync(INTERVAL);
    poller.stop();
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('con un lote de 200 consulta de inmediato', async () => {
    const responses = [page(1, 200), page(2, 200), page(3, 5)];
    const { poller, fetchMock, onUpdates } = setup(async () => responses.shift() ?? page(4));

    poller.start();
    await vi.advanceTimersByTimeAsync(INTERVAL - 1);
    poller.stop();

    expect(fetchMock.mock.calls.map(([since]) => since)).toEqual([0, 1, 2]);
    // Solo el último lote (incompleto) indica que ya está al día.
    expect(onUpdates.mock.calls.map(([, caughtUp]) => caughtUp)).toEqual([false, false, true]);
  });

  it('stop descarta la respuesta en curso sin avanzar el cursor', async () => {
    const slow = deferred<ReturnType<typeof page>>();
    const responses = [() => slow.promise, async () => page(20)];
    const { poller, fetchMock, onUpdates } = setup(() => responses.shift()!());

    poller.start();
    poller.stop();
    slow.resolve(page(10));
    await vi.advanceTimersByTimeAsync(INTERVAL * 2);
    expect(onUpdates).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    poller.start();
    await vi.advanceTimersByTimeAsync(0);
    poller.stop();
    expect(fetchMock.mock.calls.map(([since]) => since)).toEqual([0, 0]);
  });

  it('start después de stop espera la consulta pendiente: nunca hay dos a la vez', async () => {
    const slow = deferred<ReturnType<typeof page>>();
    const responses = [() => slow.promise, async () => page(20)];
    const { poller, fetchMock } = setup(() => responses.shift()!());

    poller.start();
    poller.stop();
    poller.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    slow.resolve(page(10));
    await vi.advanceTimersByTimeAsync(0);
    poller.stop();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('start doble no duplica las consultas', async () => {
    const { poller, fetchMock } = setup(async () => page(10));

    poller.start();
    poller.start();
    await vi.advanceTimersByTimeAsync(INTERVAL);
    poller.stop();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('se detiene si la sesión expiró', async () => {
    const { poller, fetchMock, statuses } = setup(async () => {
      throw new SessionExpiredError();
    });

    poller.start();
    await vi.advanceTimersByTimeAsync(INTERVAL * 5);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(statuses).toEqual([]);
  });
});
