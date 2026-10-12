import { useMemo } from 'react';
import type { NetworkStatus } from '../lib/poller';
import { isStale, secondsSince } from '../lib/positions';
import { Vehicle } from '../lib/types';
import { useFleet } from '../state/fleetStore';
import { useNow } from './useNow';

export interface VehicleRowModel {
  vehicle: Vehicle;
  speedKmh: number | null;
  secondsAgo: number | null;
  stale: boolean;
  unread: number;
}

/** Filas de la lista; un solo reloj recalcula "visto hace X s" de todas (D7). */
export function useVehicleList(): {
  rows: VehicleRowModel[];
  loading: boolean;
  network: NetworkStatus;
} {
  const vehicles = useFleet((s) => s.vehicles);
  const positions = useFleet((s) => s.positions);
  const loading = useFleet((s) => !s.vehiclesLoaded);
  const network = useFleet((s) => s.network);
  const now = useNow();

  const rows = useMemo(
    () =>
      vehicles.map((vehicle) => {
        const position = positions[vehicle.id];
        return {
          vehicle,
          speedKmh: position ? position.speedKmh : null,
          secondsAgo: position ? secondsSince(position.recordedAt, now) : null,
          stale: position ? isStale(position.recordedAt, now) : false,
          // Las alertas sin leer llegan con la spec 03.
          unread: 0,
        };
      }),
    [vehicles, positions, now],
  );

  return { rows, loading, network };
}
