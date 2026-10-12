import { describe, expect, it } from 'vitest';
import { applyUpdates, secondsSince } from './positions';
import { PositionUpdate } from './types';

const position = (vehicleId: string, recordedAt: string, speedKmh = 30): PositionUpdate => ({
  vehicleId,
  lat: 6.24,
  lng: -75.58,
  speedKmh,
  heading: 90,
  recordedAt,
});

describe('applyUpdates', () => {
  it('agrega vehículos que no estaban en el estado', () => {
    const next = applyUpdates({}, [position('veh-01', '2026-10-09T15:00:00.000Z')]);
    expect(Object.keys(next)).toEqual(['veh-01']);
  });

  it('reemplaza la posición anterior por la nueva', () => {
    const current = { 'veh-01': position('veh-01', '2026-10-09T15:00:00.000Z', 30) };
    const next = applyUpdates(current, [position('veh-01', '2026-10-09T15:00:02.000Z', 45)]);
    expect(next['veh-01'].speedKmh).toBe(45);
  });

  it('se queda con la última posición de cada vehículo dentro de un lote', () => {
    const next = applyUpdates({}, [
      position('veh-01', '2026-10-09T15:00:00.000Z', 10),
      position('veh-02', '2026-10-09T15:00:00.000Z', 20),
      position('veh-01', '2026-10-09T15:00:02.000Z', 15),
    ]);
    expect(next['veh-01'].speedKmh).toBe(15);
    expect(next['veh-02'].speedKmh).toBe(20);
  });

  it('no modifica el estado recibido', () => {
    const current = { 'veh-01': position('veh-01', '2026-10-09T15:00:00.000Z') };
    applyUpdates(current, [position('veh-01', '2026-10-09T15:00:02.000Z', 99)]);
    expect(current['veh-01'].speedKmh).toBe(30);
  });

  it('devuelve la misma referencia si el lote viene vacío', () => {
    const current = { 'veh-01': position('veh-01', '2026-10-09T15:00:00.000Z') };
    expect(applyUpdates(current, [])).toBe(current);
  });
});

describe('secondsSince', () => {
  it('calcula los segundos desde la posición', () => {
    const now = new Date('2026-10-09T15:00:30.000Z').getTime();
    expect(secondsSince('2026-10-09T15:00:00.000Z', now)).toBe(30);
  });

  it('nunca devuelve valores negativos', () => {
    const now = new Date('2026-10-09T15:00:00.000Z').getTime();
    expect(secondsSince('2026-10-09T15:00:05.000Z', now)).toBe(0);
  });
});
