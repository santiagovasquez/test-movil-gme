import { PositionUpdate } from './types';

export type PositionsByVehicle = Record<string, PositionUpdate>;

/** Un vehículo sin reportar por más de estos segundos se muestra "Sin señal". */
export const STALE_AFTER_S = 30;

/**
 * Aplica un lote de posiciones recibidas del servidor al estado actual
 * (la última posición conocida de cada vehículo).
 * Ignora posiciones repetidas o atrasadas: solo gana un `recordedAt` más reciente (D1).
 * Devuelve la misma referencia si no hay cambios, para evitar renders innecesarios.
 */
export function applyUpdates(
  current: PositionsByVehicle,
  updates: PositionUpdate[],
): PositionsByVehicle {
  let next: PositionsByVehicle | null = null;
  for (const update of updates) {
    const known = (next ?? current)[update.vehicleId];
    if (known && Date.parse(update.recordedAt) <= Date.parse(known.recordedAt)) continue;
    next ??= { ...current };
    next[update.vehicleId] = update;
  }
  return next ?? current;
}

/** Segundos transcurridos desde la última posición reportada. */
export function secondsSince(recordedAt: string, now: number = Date.now()): number {
  return Math.max(0, Math.floor((now - new Date(recordedAt).getTime()) / 1000));
}

/** `true` si la posición tiene más de `STALE_AFTER_S` segundos. */
export function isStale(recordedAt: string, now: number = Date.now()): boolean {
  return secondsSince(recordedAt, now) > STALE_AFTER_S;
}

/** "hace 12 s" o, desde un minuto, "hace 3 min". */
export function formatAgo(seconds: number): string {
  return seconds < 60 ? `hace ${seconds} s` : `hace ${Math.floor(seconds / 60)} min`;
}
