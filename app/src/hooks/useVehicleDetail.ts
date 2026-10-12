import { useCallback, useMemo } from 'react';
import { ToastAndroid } from 'react-native';
import { secondsSince, VehicleStatus, vehicleStatus } from '../lib/positions';
import { Alert, PositionUpdate, Vehicle } from '../lib/types';
import { fleetStore, useFleet } from '../state/fleetStore';
import { useSession } from '../state/SessionProvider';
import { useNow } from './useNow';

/** Datos del detalle, leídos del mismo store que la lista (D4, D5). */
export function useVehicleDetail(vehicleId: string): {
  /** Qué partes todavía esperan su primera respuesta (skeleton). */
  loading: { vehicle: boolean; position: boolean; alerts: boolean };
  vehicle: Vehicle | undefined;
  position: PositionUpdate | undefined;
  secondsAgo: number | null;
  status: VehicleStatus;
  distanceKm: number;
  alerts: Alert[];
  markAsRead(id: string): Promise<void>;
} {
  const { api } = useSession();
  const vehicle = useFleet((s) => s.vehicles.find((v) => v.id === vehicleId));
  const position = useFleet((s) => s.positions[vehicleId]);
  const distanceKm = useFleet((s) => s.distances[vehicleId] ?? 0);
  const allAlerts = useFleet((s) => s.alerts);
  const vehicleLoading = useFleet((s) => !s.vehiclesLoaded);
  const positionLoading = useFleet((s) => !s.positionsLoaded);
  const alertsLoading = useFleet((s) => !s.alertsLoaded);
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
    loading: { vehicle: vehicleLoading, position: positionLoading, alerts: alertsLoading },
    vehicle,
    position,
    secondsAgo: position ? secondsSince(position.recordedAt, now) : null,
    status: vehicleStatus(position, now),
    distanceKm,
    alerts,
    markAsRead,
  };
}
