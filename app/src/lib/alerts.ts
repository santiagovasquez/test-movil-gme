import { Alert } from './types';

/** Cantidad de alertas sin leer de cada vehículo (los que no tienen no aparecen). */
export function unreadCountByVehicle(alerts: Alert[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const alert of alerts) {
    if (!alert.read) counts[alert.vehicleId] = (counts[alert.vehicleId] ?? 0) + 1;
  }
  return counts;
}

/**
 * Marca como leídas las alertas cuyo `POST /read` sigue en curso, para que una
 * respuesta de `GET /alerts` que salió antes no deshaga el cambio (D2).
 */
export function applyPendingReads(alerts: Alert[], pending: ReadonlySet<string>): Alert[] {
  if (pending.size === 0) return alerts;
  return alerts.map((alert) =>
    pending.has(alert.id) && !alert.read ? { ...alert, read: true } : alert,
  );
}
