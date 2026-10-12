import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { applyPendingReads } from '../lib/alerts';
import { ApiError } from '../lib/http';
import type { NetworkStatus } from '../lib/poller';
import { applyUpdates, PositionsByVehicle, trackDistances } from '../lib/positions';
import { Alert, PositionUpdate, Vehicle } from '../lib/types';

interface FleetState {
  vehicles: Vehicle[];
  vehiclesLoaded: boolean;
  positions: PositionsByVehicle;
  /** Ya se recorrió el historial de posiciones: los datos están al día. */
  positionsLoaded: boolean;
  /** Km recorridos por vehículo según las posiciones recibidas. */
  distances: Record<string, number>;
  network: NetworkStatus;
  alerts: Alert[];
  /** Ya llegó la primera respuesta de alertas. */
  alertsLoaded: boolean;
  /** Alertas con `POST /read` en curso. */
  pendingReads: Set<string>;
  setVehicles(vehicles: Vehicle[]): void;
  applyPositions(updates: PositionUpdate[], caughtUp?: boolean): void;
  setNetwork(network: NetworkStatus): void;
  /** Reemplaza las alertas respetando las que se están marcando como leídas (D2). */
  setAlerts(items: Alert[]): void;
  /** Marca como leída al instante y confirma con el servidor (D1, D3). */
  markAlertRead(id: string, send: (id: string) => Promise<Alert>): Promise<'ok' | 'failed'>;
  /** Vuelve al estado inicial al cerrar sesión (D8). */
  reset(): void;
}

const initialState = () => ({
  vehicles: [] as Vehicle[],
  vehiclesLoaded: false,
  positions: {} as PositionsByVehicle,
  positionsLoaded: false,
  distances: {} as Record<string, number>,
  network: 'ok' as NetworkStatus,
  alerts: [] as Alert[],
  alertsLoaded: false,
  pendingReads: new Set<string>(),
});

export const fleetStore = createStore<FleetState>()((set, get) => {
  const updateAlert = (id: string, change: (alert: Alert) => Alert | null) =>
    set((state) => ({
      alerts: state.alerts.flatMap((alert) => {
        if (alert.id !== id) return [alert];
        const next = change(alert);
        return next ? [next] : [];
      }),
    }));

  const setPending = (id: string, pending: boolean) =>
    set((state) => {
      const pendingReads = new Set(state.pendingReads);
      if (pending) pendingReads.add(id);
      else pendingReads.delete(id);
      return { pendingReads };
    });

  return {
    ...initialState(),
    setVehicles: (vehicles) => set({ vehicles, vehiclesLoaded: true }),
    applyPositions: (updates, caughtUp = true) =>
      set((state) => {
        const positions = applyUpdates(state.positions, updates);
        const positionsLoaded = state.positionsLoaded || caughtUp;
        if (positions === state.positions && positionsLoaded === state.positionsLoaded) return state;
        const distances = trackDistances(state.positions, state.distances, updates);
        return { positions, positionsLoaded, distances };
      }),
    setNetwork: (network) => set({ network }),
    setAlerts: (items) =>
      set((state) => ({ alerts: applyPendingReads(items, state.pendingReads), alertsLoaded: true })),

    async markAlertRead(id, send) {
      const current = get().alerts.find((alert) => alert.id === id);
      if (!current || current.read) return 'ok';

      setPending(id, true);
      updateAlert(id, (alert) => ({ ...alert, read: true }));
      try {
        const confirmed = await send(id);
        updateAlert(id, () => confirmed);
        return 'ok';
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          // Ya no existe en el servidor: se retira.
          updateAlert(id, () => null);
          return 'ok';
        }
        updateAlert(id, (alert) => ({ ...alert, read: false }));
        return 'failed';
      } finally {
        setPending(id, false);
      }
    },

    reset: () => set(initialState()),
  };
});

export function useFleet<T>(selector: (state: FleetState) => T): T {
  return useStore(fleetStore, selector);
}
