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

/** Por debajo de esta velocidad el vehículo se considera detenido. */
export const STOPPED_BELOW_KMH = 3;

export type VehicleStatus = 'moving' | 'stopped' | 'stale' | 'noData';

export function vehicleStatus(position: PositionUpdate | undefined, now: number = Date.now()): VehicleStatus {
  if (!position) return 'noData';
  if (isStale(position.recordedAt, now)) return 'stale';
  return position.speedKmh < STOPPED_BELOW_KMH ? 'stopped' : 'moving';
}

/** Distancia en km entre dos posiciones (fórmula del haversine). */
export function distanceKm(a: Pick<PositionUpdate, 'lat' | 'lng'>, b: Pick<PositionUpdate, 'lat' | 'lng'>): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/**
 * Suma a cada vehículo la distancia entre su última posición y las nuevas,
 * con la misma regla que `applyUpdates`: las repetidas o atrasadas no cuentan.
 * Llamar con las posiciones de antes de aplicar el lote.
 */
export function trackDistances(
  current: PositionsByVehicle,
  distances: Record<string, number>,
  updates: PositionUpdate[],
): Record<string, number> {
  let next: Record<string, number> | null = null;
  const last: PositionsByVehicle = { ...current };
  for (const update of updates) {
    const known = last[update.vehicleId];
    if (known && Date.parse(update.recordedAt) <= Date.parse(known.recordedAt)) continue;
    last[update.vehicleId] = update;
    if (!known) continue;
    next ??= { ...distances };
    next[update.vehicleId] = (next[update.vehicleId] ?? 0) + distanceKm(known, update);
  }
  return next ?? distances;
}

const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

/** Rumbo en grados a punto cardinal (N, NE, E…). */
export function cardinal(heading: number): string {
  return CARDINALS[Math.round((((heading % 360) + 360) % 360) / 45) % 8];
}
