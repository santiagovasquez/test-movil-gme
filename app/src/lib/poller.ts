import { SessionExpiredError } from './session';
import { PositionUpdate } from './types';

/** Máximo de posiciones por respuesta de `GET /positions` (API.md). */
const MAX_BATCH = 200;

export type NetworkStatus = 'ok' | 'reconnecting';

/**
 * Una ejecución del poller. `isCurrent()` pasa a `false` si el poller se
 * detuvo mientras la tarea estaba en curso: su resultado debe descartarse.
 */
export type PollTask = (isCurrent: () => boolean) => Promise<{ again: boolean }>;

interface PollerOptions {
  task: PollTask;
  intervalMs: number;
  onStatusChange?: (status: NetworkStatus) => void;
  failuresBeforeWarning?: number;
}

/**
 * Ejecuta `task` cada `intervalMs` sin solaparse: la siguiente ejecución se
 * programa al terminar la anterior (D2). `start()` ejecuta de inmediato.
 */
export function createPoller({
  task,
  intervalMs,
  onStatusChange,
  failuresBeforeWarning = 3,
}: PollerOptions) {
  let running = false;
  let generation = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inFlight: Promise<void> | null = null;
  let failures = 0;
  let status: NetworkStatus = 'ok';

  function setStatus(next: NetworkStatus) {
    if (next === status) return;
    status = next;
    onStatusChange?.(next);
  }

  function schedule(delayMs: number, gen: number) {
    timer = setTimeout(() => {
      timer = null;
      run(gen);
    }, delayMs);
  }

  function run(gen: number) {
    const isCurrent = () => gen === generation;
    inFlight = (async () => {
      let delay = intervalMs;
      try {
        const { again } = await task(isCurrent);
        if (!isCurrent()) return;
        failures = 0;
        setStatus('ok');
        if (again) delay = 0;
      } catch (error) {
        if (!isCurrent()) return;
        if (error instanceof SessionExpiredError) {
          stop();
          return;
        }
        // El cursor no avanza: se reintenta en el siguiente intervalo (D4).
        failures += 1;
        if (failures >= failuresBeforeWarning) setStatus('reconnecting');
      }
      schedule(delay, gen);
    })().finally(() => {
      inFlight = null;
    });
  }

  function start() {
    if (running) return;
    running = true;
    const gen = ++generation;
    // Si quedó una consulta de antes de `stop()`, se espera a que termine (D3).
    if (inFlight) {
      inFlight.then(() => {
        if (gen === generation) run(gen);
      });
    } else {
      run(gen);
    }
  }

  function stop() {
    running = false;
    generation += 1;
    if (timer) clearTimeout(timer);
    timer = null;
  }

  return { start, stop };
}

/** Tarea de posiciones: consulta desde el cursor y lo avanza solo con éxito (RF-2, RF-5). */
export function createPositionsTask({
  fetchPositions,
  onUpdates,
}: {
  fetchPositions: (since: number) => Promise<{ cursor: number; updates: PositionUpdate[] }>;
  onUpdates: (updates: PositionUpdate[]) => void;
}): PollTask {
  let cursor = 0;
  return async (isCurrent) => {
    const response = await fetchPositions(cursor);
    if (!isCurrent()) return { again: false };
    cursor = response.cursor;
    if (response.updates.length > 0) onUpdates(response.updates);
    // Lote lleno: hay más pendientes, se consulta de inmediato (D5).
    return { again: response.updates.length >= MAX_BATCH };
  };
}
