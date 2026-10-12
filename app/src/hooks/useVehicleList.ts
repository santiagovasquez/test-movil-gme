import { useMemo } from 'react';
import { unreadCountByVehicle } from '../lib/alerts';
import type { NetworkStatus } from '../lib/poller';
import { secondsSince, VehicleStatus, vehicleStatus } from '../lib/positions';
import { Vehicle } from '../lib/types';
import { useFleet } from '../state/fleetStore';
import { useNow } from './useNow';

export interface VehicleRowModel {
  vehicle: Vehicle;
  status: VehicleStatus;
  speedKmh: number | null;
  secondsAgo: number | null;
  distanceKm: number;
  unread: number;
}

export interface FleetSummary {
  total: number;
  moving: number;
  stale: number;
  unread: number;
}

/** Filas de la lista; un solo reloj recalcula "visto hace X s" de todas (D7). */
export function useVehicleList(): {
  rows: VehicleRowModel[];
  summary: FleetSummary;
  loading: boolean;
  network: NetworkStatus;
} {
  const vehicles = useFleet((s) => s.vehicles);
  const positions = useFleet((s) => s.positions);
  const distances = useFleet((s) => s.distances);
  // Skeleton hasta tener vehículos y las posiciones al día.
  const loading = useFleet((s) => !s.vehiclesLoaded || !s.positionsLoaded);
  const network = useFleet((s) => s.network);
  const alerts = useFleet((s) => s.alerts);
  const now = useNow();

  const unread = useMemo(() => unreadCountByVehicle(alerts), [alerts]);
  const rows = useMemo(
    () =>
      vehicles.map((vehicle) => {
        const position = positions[vehicle.id];
        return {
          vehicle,
          status: vehicleStatus(position, now),
          speedKmh: position ? position.speedKmh : null,
          secondsAgo: position ? secondsSince(position.recordedAt, now) : null,
          distanceKm: distances[vehicle.id] ?? 0,
          unread: unread[vehicle.id] ?? 0,
        };
      }),
    [vehicles, positions, distances, unread, now],
  );

  const summary = useMemo(
    () => ({
      total: rows.length,
      moving: rows.filter((row) => row.status === 'moving').length,
      stale: rows.filter((row) => row.status === 'stale').length,
      unread: rows.reduce((sum, row) => sum + row.unread, 0),
    }),
    [rows],
  );

  return { rows, summary, loading, network };
}
