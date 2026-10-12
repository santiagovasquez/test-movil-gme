import { beforeEach, describe, expect, it } from 'vitest';
import { ApiError } from '../lib/http';
import { Alert, PositionUpdate } from '../lib/types';
import { fleetStore } from './fleetStore';

const position = (recordedAt: string, speedKmh: number): PositionUpdate => ({
  vehicleId: 'veh-01',
  lat: 6.24,
  lng: -75.58,
  speedKmh,
  heading: 90,
  recordedAt,
});

beforeEach(() => fleetStore.getState().reset());

describe('fleetStore', () => {
  it('aplica posiciones ignorando las atrasadas', () => {
    const { applyPositions } = fleetStore.getState();
    applyPositions([position('2026-10-09T15:00:10.000Z', 50)]);
    applyPositions([position('2026-10-09T15:00:04.000Z', 5)]);
    expect(fleetStore.getState().positions['veh-01'].speedKmh).toBe(50);
  });

  it('no notifica cambios si el lote no trae nada nuevo', () => {
    fleetStore.getState().applyPositions([position('2026-10-09T15:00:10.000Z', 50)]);
    let notified = 0;
    const unsubscribe = fleetStore.subscribe(() => (notified += 1));
    fleetStore.getState().applyPositions([position('2026-10-09T15:00:10.000Z', 50)]);
    unsubscribe();
    expect(notified).toBe(0);
  });

  it('reset deja el estado inicial', () => {
    const state = fleetStore.getState();
    state.setVehicles([{ id: 'veh-01', label: 'Camión 01', plate: 'TSM-482', driver: 'Carlos' }]);
    state.applyPositions([position('2026-10-09T15:00:10.000Z', 50)]);
    state.setNetwork('reconnecting');
    state.reset();
    expect(fleetStore.getState()).toMatchObject({
      vehicles: [],
      vehiclesLoaded: false,
      positions: {},
      network: 'ok',
    });
  });
});

const alert = (id: string, read = false): Alert => ({
  id,
  vehicleId: 'veh-01',
  type: 'overspeed',
  message: 'Exceso de velocidad',
  createdAt: '2026-10-09T15:03:58.020Z',
  read,
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

const readOf = (id: string) => fleetStore.getState().alerts.find((a) => a.id === id)?.read;

describe('markAlertRead', () => {
  beforeEach(() => fleetStore.getState().setAlerts([alert('al-1'), alert('al-2')]));

  it('marca la alerta al instante y la confirma con el servidor', async () => {
    const post = deferred<Alert>();
    const result = fleetStore.getState().markAlertRead('al-1', () => post.promise);
    expect(readOf('al-1')).toBe(true);

    post.resolve(alert('al-1', true));
    expect(await result).toBe('ok');
    expect(readOf('al-1')).toBe(true);
    expect(fleetStore.getState().pendingReads.size).toBe(0);
  });

  it('si el envío falla vuelve a "sin leer"', async () => {
    const result = await fleetStore
      .getState()
      .markAlertRead('al-1', () => Promise.reject(new ApiError(0, 'Sin conexión')));
    expect(result).toBe('failed');
    expect(readOf('al-1')).toBe(false);
    expect(fleetStore.getState().pendingReads.size).toBe(0);
  });

  it('con 404 retira la alerta', async () => {
    const result = await fleetStore
      .getState()
      .markAlertRead('al-1', () => Promise.reject(new ApiError(404, 'No existe')));
    expect(result).toBe('ok');
    expect(fleetStore.getState().alerts.map((a) => a.id)).toEqual(['al-2']);
  });

  it('una consulta de alertas durante el envío no revierte el cambio', async () => {
    const post = deferred<Alert>();
    const result = fleetStore.getState().markAlertRead('al-1', () => post.promise);

    fleetStore.getState().setAlerts([alert('al-1'), alert('al-2')]);
    expect(readOf('al-1')).toBe(true);
    expect(readOf('al-2')).toBe(false);

    post.resolve(alert('al-1', true));
    await result;
    expect(readOf('al-1')).toBe(true);
  });
});
