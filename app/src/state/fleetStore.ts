import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import type { NetworkStatus } from '../lib/poller';
import { applyUpdates, PositionsByVehicle } from '../lib/positions';
import { PositionUpdate, Vehicle } from '../lib/types';

interface FleetState {
  vehicles: Vehicle[];
  vehiclesLoaded: boolean;
  positions: PositionsByVehicle;
  network: NetworkStatus;
  setVehicles(vehicles: Vehicle[]): void;
  applyPositions(updates: PositionUpdate[]): void;
  setNetwork(network: NetworkStatus): void;
  /** Vuelve al estado inicial al cerrar sesión (D8). */
  reset(): void;
}

const initialState = {
  vehicles: [] as Vehicle[],
  vehiclesLoaded: false,
  positions: {} as PositionsByVehicle,
  network: 'ok' as NetworkStatus,
};

export const fleetStore = createStore<FleetState>()((set) => ({
  ...initialState,
  setVehicles: (vehicles) => set({ vehicles, vehiclesLoaded: true }),
  applyPositions: (updates) =>
    set((state) => {
      const positions = applyUpdates(state.positions, updates);
      return positions === state.positions ? state : { positions };
    }),
  setNetwork: (network) => set({ network }),
  reset: () => set(initialState),
}));

export function useFleet<T>(selector: (state: FleetState) => T): T {
  return useStore(fleetStore, selector);
}
