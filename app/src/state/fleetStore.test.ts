import { beforeEach, describe, expect, it } from 'vitest';
import { PositionUpdate } from '../lib/types';
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
