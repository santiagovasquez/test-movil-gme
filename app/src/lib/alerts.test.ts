import { describe, expect, it } from 'vitest';
import { applyPendingReads, unreadCountByVehicle } from './alerts';
import { Alert } from './types';

const alert = (id: string, vehicleId: string, read = false): Alert => ({
  id,
  vehicleId,
  type: 'overspeed',
  message: 'Exceso de velocidad',
  createdAt: '2026-10-09T15:03:58.020Z',
  read,
});

describe('unreadCountByVehicle', () => {
  it('cuenta solo las alertas sin leer de cada vehículo', () => {
    const counts = unreadCountByVehicle([
      alert('al-1', 'veh-01'),
      alert('al-2', 'veh-01'),
      alert('al-3', 'veh-01', true),
      alert('al-4', 'veh-02', true),
      alert('al-5', 'veh-03'),
    ]);
    expect(counts).toEqual({ 'veh-01': 2, 'veh-03': 1 });
  });
});

describe('applyPendingReads', () => {
  it('marca como leídas solo las alertas pendientes', () => {
    const result = applyPendingReads(
      [alert('al-1', 'veh-01'), alert('al-2', 'veh-01')],
      new Set(['al-2']),
    );
    expect(result.map((a) => a.read)).toEqual([false, true]);
  });

  it('devuelve la misma lista si no hay pendientes', () => {
    const alerts = [alert('al-1', 'veh-01')];
    expect(applyPendingReads(alerts, new Set())).toBe(alerts);
  });
});
