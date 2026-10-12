import { describe, expect, it } from 'vitest';
import { applyUpdates, formatAgo, isStale, secondsSince } from './positions';
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

  it('una posición atrasada no reemplaza a la actual', () => {
    const current = { 'veh-01': position('veh-01', '2026-10-09T15:00:10.000Z', 50) };
    const next = applyUpdates(current, [position('veh-01', '2026-10-09T15:00:04.000Z', 5)]);
    expect(next['veh-01'].speedKmh).toBe(50);
    expect(next).toBe(current);
  });

  it('una posición repetida no reemplaza a la actual', () => {
    const current = { 'veh-01': position('veh-01', '2026-10-09T15:00:10.000Z', 50) };
    const next = applyUpdates(current, [position('veh-01', '2026-10-09T15:00:10.000Z', 50)]);
    expect(next).toBe(current);
  });

  it('se queda con la más reciente aunque el lote venga desordenado', () => {
    const next = applyUpdates({}, [
      position('veh-01', '2026-10-09T15:00:06.000Z', 60),
      position('veh-01', '2026-10-09T15:00:02.000Z', 20),
      position('veh-01', '2026-10-09T15:00:04.000Z', 40),
    ]);
    expect(next['veh-01'].speedKmh).toBe(60);
  });
});

describe('isStale', () => {
  const recordedAt = '2026-10-09T15:00:00.000Z';
  const at = (s: number) => new Date(recordedAt).getTime() + s * 1000;

  it('no está sin señal a los 30 s', () => {
    expect(isStale(recordedAt, at(30))).toBe(false);
  });

  it('está sin señal a los 31 s', () => {
    expect(isStale(recordedAt, at(31))).toBe(true);
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

describe('formatAgo', () => {
  it('usa segundos por debajo de un minuto', () => {
    expect(formatAgo(59)).toBe('hace 59 s');
  });

  it('usa minutos desde un minuto', () => {
    expect(formatAgo(60)).toBe('hace 1 min');
    expect(formatAgo(185)).toBe('hace 3 min');
  });
});
