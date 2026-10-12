import { PositionUpdate } from './types';

export type PositionsByVehicle = Record<string, PositionUpdate>;

/**
 * Aplica un lote de posiciones recibidas del servidor al estado actual
 * (la última posición conocida de cada vehículo).
 * Devuelve la misma referencia si no hay cambios, para evitar renders innecesarios.
 */
export function applyUpdates(
  current: PositionsByVehicle,
  updates: PositionUpdate[],
): PositionsByVehicle {
  if (updates.length === 0) {
    return current;
  }
  const next = { ...current };
  for (const update of updates) {
    next[update.vehicleId] = update;
  }
  return next;
}

/** Segundos transcurridos desde la última posición reportada. */
export function secondsSince(recordedAt: string, now: number = Date.now()): number {
  return Math.max(0, Math.floor((now - new Date(recordedAt).getTime()) / 1000));
}
