import { useEffect } from 'react';
import { AppState } from 'react-native';
import { createPoller, createPositionsTask } from '../lib/poller';
import { SessionExpiredError } from '../lib/session';
import { fleetStore } from '../state/fleetStore';
import { useSession } from '../state/SessionProvider';

const POSITIONS_INTERVAL_MS = 3000;
const ALERTS_INTERVAL_MS = 10_000;
const VEHICLES_RETRY_MS = 3000;

/**
 * Mantiene el store de flota al día mientras haya sesión: carga los vehículos
 * y consulta posiciones y alertas solo con la app al frente (HU-3).
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

    const positionsPoller = createPoller({
      task: createPositionsTask({
        fetchPositions: api.fetchPositions,
        onUpdates: store.applyPositions,
      }),
      intervalMs: POSITIONS_INTERVAL_MS,
      onStatusChange: store.setNetwork,
    });
    // El aviso "Reconectando…" sale solo de posiciones; las alertas reintentan en silencio.
    const alertsPoller = createPoller({
      task: async (isCurrent) => {
        const { items } = await api.fetchAlerts();
        if (isCurrent()) store.setAlerts(items);
        return { again: false };
      },
      intervalMs: ALERTS_INTERVAL_MS,
    });
    const pollers = [positionsPoller, alertsPoller];

    loadVehicles();
    if (AppState.currentState !== 'background') pollers.forEach((p) => p.start());
    const subscription = AppState.addEventListener('change', (state) => {
      pollers.forEach((p) => (state === 'active' ? p.start() : p.stop()));
    });

    return () => {
      active = false;
      clearTimeout(retryTimer);
      subscription.remove();
      pollers.forEach((p) => p.stop());
      fleetStore.getState().reset();
    };
  }, [api]);
}
