import { useCallback, useMemo } from 'react';
import { ToastAndroid } from 'react-native';
import { isStale, secondsSince } from '../lib/positions';
import { Alert, PositionUpdate, Vehicle } from '../lib/types';
import { fleetStore, useFleet } from '../state/fleetStore';
import { useSession } from '../state/SessionProvider';
import { useNow } from './useNow';

/** Datos del detalle, leídos del mismo store que la lista (D4, D5). */
export function useVehicleDetail(vehicleId: string): {
  vehicle: Vehicle | undefined;
  position: PositionUpdate | undefined;
  secondsAgo: number | null;
  stale: boolean;
  alerts: Alert[];
  markAsRead(id: string): Promise<void>;
} {
  const { api } = useSession();
  const vehicle = useFleet((s) => s.vehicles.find((v) => v.id === vehicleId));
  const position = useFleet((s) => s.positions[vehicleId]);
  const allAlerts = useFleet((s) => s.alerts);
  const now = useNow();

  // El servidor ya las entrega de la más reciente a la más antigua.
  const alerts = useMemo(
    () => allAlerts.filter((alert) => alert.vehicleId === vehicleId),
    [allAlerts, vehicleId],
  );

  const markAsRead = useCallback(
    async (id: string) => {
      const result = await fleetStore.getState().markAlertRead(id, api.markAlertRead);
      if (result === 'failed') ToastAndroid.show('No se pudo marcar la alerta', ToastAndroid.SHORT);
    },
    [api],
  );

  return {
    vehicle,
    position,
    secondsAgo: position ? secondsSince(position.recordedAt, now) : null,
    stale: position ? isStale(position.recordedAt, now) : false,
    alerts,
    markAsRead,
  };
}
