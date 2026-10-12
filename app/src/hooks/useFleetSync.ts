import { useEffect } from 'react';
import { AppState } from 'react-native';
import { createPoller, createPositionsTask } from '../lib/poller';
import { SessionExpiredError } from '../lib/session';
import { fleetStore } from '../state/fleetStore';
import { useSession } from '../state/SessionProvider';

const POSITIONS_INTERVAL_MS = 3000;
const VEHICLES_RETRY_MS = 3000;

/**
 * Mantiene el store de flota al día mientras haya sesión: carga los vehículos
 * y consulta posiciones solo con la app al frente (HU-3).
 * Al desmontarse (logout o sesión expirada) detiene todo y limpia el store.
 */
export function useFleetSync(): void {
  const { api } = useSession();

  useEffect(() => {
    const store = fleetStore.getState();
    let active = true;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    async function loadVehicles() {
      try {
        const { items } = await api.fetchVehicles();
        if (active) store.setVehicles(items);
      } catch (error) {
        if (!active || error instanceof SessionExpiredError) return;
        retryTimer = setTimeout(loadVehicles, VEHICLES_RETRY_MS);
      }
    }

    const poller = createPoller({
      task: createPositionsTask({
        fetchPositions: api.fetchPositions,
        onUpdates: store.applyPositions,
      }),
      intervalMs: POSITIONS_INTERVAL_MS,
      onStatusChange: store.setNetwork,
    });

    loadVehicles();
    if (AppState.currentState !== 'background') poller.start();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') poller.start();
      else poller.stop();
    });

    return () => {
      active = false;
      clearTimeout(retryTimer);
      subscription.remove();
      poller.stop();
      fleetStore.getState().reset();
    };
  }, [api]);
}
