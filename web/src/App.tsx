import {
  mdiAccountOutline,
  mdiCheckAll,
  mdiClockOutline,
  mdiEyeOffOutline,
  mdiEyeOutline,
  mdiLogout,
  mdiMapMarkerDistance,
  mdiMapMarkerOutline,
  mdiNavigation,
  mdiSpeedometer,
} from '@mdi/js';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { applyPendingReads, unreadCountByVehicle } from '@app/lib/alerts';
import { authApi, createApi } from '@app/lib/api';
import { ApiError, createHttpClient } from '@app/lib/http';
import { createPoller, createPositionsTask, NetworkStatus } from '@app/lib/poller';
import {
  applyUpdates,
  cardinal,
  formatAgo,
  PositionsByVehicle,
  secondsSince,
  trackDistances,
  vehicleStatus,
} from '@app/lib/positions';
import { createSessionManager, SessionExpiredError } from '@app/lib/session';
import type { Alert, PositionUpdate, User, Vehicle } from '@app/lib/types';
import {
  AlertItem,
  Field,
  FleetSummaryBar,
  Icon,
  Logo,
  StatTile,
  StatusChip,
  VehicleCard,
  VehicleCardSkeleton,
  VehicleIcon,
  VehicleRowModel,
} from './components';
import { localTokenStorage } from './tokenStorage';
import { VehicleMap } from './VehicleMap';

// Misma composición que la app (SessionProvider); solo cambia el almacenamiento.
const session = createSessionManager({ storage: localTokenStorage, auth: authApi });
const api = createApi(createHttpClient({ session }));
// Una sola vez al cargar (StrictMode monta los efectos dos veces en desarrollo).
const restored = session.restore();

const POSITIONS_INTERVAL_MS = 3000;
const ALERTS_INTERVAL_MS = 10_000;
const VEHICLES_RETRY_MS = 3000;
const EXPIRED_NOTICE = 'Tu sesión expiró. Inicia sesión de nuevo.';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    restored.then((u) => {
      setUser(u);
      setRestoring(false);
    });
    return session.onExpired(() => {
      setUser(null);
      setNotice(EXPIRED_NOTICE);
    });
  }, []);

  if (restoring) return null;
  if (!user) {
    return (
      <Login
        notice={notice}
        onLogin={(u) => {
          setNotice(null);
          setUser(u);
        }}
      />
    );
  }
  return (
    <Fleet
      user={user}
      onLogout={async () => {
        await session.logout();
        setUser(null);
      }}
    />
  );
}

function Login({ notice, onLogin }: { notice: string | null; onLogin: (user: User) => void }) {
  const [email, setEmail] = useState('supervisor@gme.co');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      onLogin(await session.login(email.trim(), password));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión');
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <Logo />
        {notice && <p className="notice">{notice}</p>}
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo"
          required
        />
        <div className="input password-row">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            required
          />
          <button
            type="button"
            className="icon-button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <Icon path={showPassword ? mdiEyeOffOutline : mdiEyeOutline} size={22} color="#616e7c" />
          </button>
        </div>
        {error && <p className="error">{error}</p>}
        <button className="primary" disabled={loading}>
          {loading ? <span className="spinner" /> : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

interface Tracking {
  positions: PositionsByVehicle;
  distances: Record<string, number>;
}

function Fleet({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [tracking, setTracking] = useState<Tracking>({ positions: {}, distances: {} });
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [pendingReads, setPendingReads] = useState<ReadonlySet<string>>(new Set());
  const [network, setNetwork] = useState<NetworkStatus>('ok');
  const [selected, setSelected] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(id);
  }, [toast]);

  // Equivalente web de useFleetSync: `visibilitychange` en lugar de AppState.
  useEffect(() => {
    let active = true;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    async function loadVehicles() {
      try {
        const { items } = await api.fetchVehicles();
        if (active) setVehicles(items);
      } catch (error) {
        if (!active || error instanceof SessionExpiredError) return;
        retryTimer = setTimeout(loadVehicles, VEHICLES_RETRY_MS);
      }
    }

    const onUpdates = (updates: PositionUpdate[]) =>
      setTracking((t) => ({
        distances: trackDistances(t.positions, t.distances, updates),
        positions: applyUpdates(t.positions, updates),
      }));

    const pollers = [
      createPoller({
        task: createPositionsTask({ fetchPositions: api.fetchPositions, onUpdates }),
        intervalMs: POSITIONS_INTERVAL_MS,
        onStatusChange: setNetwork,
      }),
      // El aviso "Reconectando…" sale solo de posiciones; las alertas reintentan en silencio.
      createPoller({
        task: async (isCurrent) => {
          const { items } = await api.fetchAlerts();
          if (isCurrent()) setAlerts(items);
          return { again: false };
        },
        intervalMs: ALERTS_INTERVAL_MS,
      }),
    ];

    const sync = () => pollers.forEach((p) => (document.hidden ? p.stop() : p.start()));
    loadVehicles();
    sync();
    document.addEventListener('visibilitychange', sync);

    return () => {
      active = false;
      clearTimeout(retryTimer);
      document.removeEventListener('visibilitychange', sync);
      pollers.forEach((p) => p.stop());
    };
  }, []);

  const visibleAlerts = useMemo(
    () => (alerts ? applyPendingReads(alerts, pendingReads) : null),
    [alerts, pendingReads],
  );

  const updateAlert = (id: string, change: (alert: Alert) => Alert | null) =>
    setAlerts((list) =>
      list ? list.flatMap((alert) => (alert.id === id ? (change(alert) ?? []) : [alert])) : list,
    );

  const setPending = (id: string, pending: boolean) =>
    setPendingReads((current) => {
      const next = new Set(current);
      if (pending) next.add(id);
      else next.delete(id);
      return next;
    });

  // Mismo flujo que `fleetStore.markAlertRead` de la app.
  async function markAsRead(id: string) {
    setPending(id, true);
    try {
      const confirmed = await api.markAlertRead(id);
      updateAlert(id, () => confirmed);
    } catch (error) {
      // Ya no existe en el servidor: se retira.
      if (error instanceof ApiError && error.status === 404) updateAlert(id, () => null);
      else setToast('No se pudo marcar la alerta');
    } finally {
      setPending(id, false);
    }
  }

  const rows: VehicleRowModel[] = useMemo(() => {
    const unread = unreadCountByVehicle(visibleAlerts ?? []);
    return (vehicles ?? []).map((vehicle) => {
      const position = tracking.positions[vehicle.id];
      return {
        vehicle,
        status: vehicleStatus(position, now),
        speedKmh: position ? position.speedKmh : null,
        secondsAgo: position ? secondsSince(position.recordedAt, now) : null,
        distanceKm: tracking.distances[vehicle.id] ?? 0,
        unread: unread[vehicle.id] ?? 0,
      };
    });
  }, [vehicles, tracking, visibleAlerts, now]);

  const summary = {
    total: rows.length,
    moving: rows.filter((row) => row.status === 'moving').length,
    stale: rows.filter((row) => row.status === 'stale').length,
    unread: rows.reduce((sum, row) => sum + row.unread, 0),
  };

  const selectedRow = rows.find((row) => row.vehicle.id === selected);
  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('');

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-badge">
            <Icon path={mdiNavigation} size={18} color="#fff" />
          </span>
          GME Flota
        </div>
        <div className="profile">
          <span className="avatar">{initials}</span>
          <div className="profile-text">
            <span className="profile-name">{user.name}</span>
            <span className="profile-email">{user.email}</span>
          </div>
          <button className="icon-button" onClick={onLogout} aria-label="Cerrar sesión" title="Cerrar sesión">
            <Icon path={mdiLogout} size={20} color="#616e7c" />
          </button>
        </div>
      </header>
      {network === 'reconnecting' && <div className="banner">Reconectando…</div>}

      <main className="layout">
        <section className="list">
          <h2 className="page-title">Vehículos</h2>
          {vehicles === null ? (
            Array.from({ length: 6 }, (_, i) => <VehicleCardSkeleton key={i} />)
          ) : (
            <>
              <FleetSummaryBar summary={summary} />
              {rows.map((row) => (
                <VehicleCard
                  key={row.vehicle.id}
                  {...row}
                  selected={row.vehicle.id === selected}
                  onPress={() => setSelected(row.vehicle.id)}
                />
              ))}
            </>
          )}
        </section>

        <section className="detail">
          {selectedRow ? (
            <VehicleDetail
              row={selectedRow}
              position={tracking.positions[selectedRow.vehicle.id]}
              alerts={visibleAlerts?.filter((a) => a.vehicleId === selectedRow.vehicle.id) ?? null}
              onMarkAsRead={markAsRead}
            />
          ) : (
            <p className="empty placeholder">Selecciona un vehículo para ver su detalle y alertas.</p>
          )}
        </section>
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function VehicleDetail({
  row: { vehicle, status, secondsAgo, distanceKm },
  position,
  alerts,
  onMarkAsRead,
}: {
  row: VehicleRowModel;
  position: PositionUpdate | undefined;
  alerts: Alert[] | null;
  onMarkAsRead(id: string): void;
}) {
  const unread = alerts?.filter((a) => !a.read).length ?? 0;

  return (
    <div className="detail-content">
      <div className="card hero">
        <VehicleIcon label={vehicle.label} status={status} size={60} />
        <div className="hero-text">
          <span className="hero-title">{vehicle.label}</span>
          <div className="subtitle">
            <span className="plate">{vehicle.plate}</span>
            <Icon path={mdiAccountOutline} size={13} color="#7b8794" />
            <span className="driver">{vehicle.driver}</span>
          </div>
          <StatusChip status={status} />
        </div>
      </div>

      {/* `key`: al cambiar de vehículo el mapa se crea de nuevo, sin la estela del anterior. */}
      {position && <VehicleMap key={vehicle.id} position={position} status={status} />}

      <div className="grid">
        <StatTile
          icon={<Icon path={mdiSpeedometer} size={20} color="#1b5e9c" />}
          label="Velocidad"
          value={position ? String(position.speedKmh) : '—'}
          unit={position ? 'km/h' : undefined}
        />
        <StatTile
          icon={
            // El ícono apunta al norte: se rota con el rumbo.
            <span style={{ display: 'flex', transform: `rotate(${position?.heading ?? 0}deg)` }}>
              <Icon path={mdiNavigation} size={18} color="#1b5e9c" />
            </span>
          }
          label="Rumbo"
          value={position ? `${cardinal(position.heading)} · ${position.heading}°` : '—'}
        />
        <StatTile
          icon={<Icon path={mdiMapMarkerDistance} size={20} color="#1b5e9c" />}
          label="Recorrido"
          value={distanceKm.toFixed(1)}
          unit="km"
        />
        <StatTile
          icon={<Icon path={mdiClockOutline} size={20} color="#1b5e9c" />}
          label="Última señal"
          value={secondsAgo === null ? '—' : formatAgo(secondsAgo)}
        />
      </div>

      <div className="card location">
        <div className="card-title">
          <Icon path={mdiMapMarkerOutline} size={18} color="#1b5e9c" />
          <span className="section-title">Ubicación</span>
        </div>
        {position ? (
          <>
            <Field label="Latitud" value={position.lat.toFixed(6)} />
            <Field label="Longitud" value={position.lng.toFixed(6)} />
            <Field label="Registrada" value={new Date(position.recordedAt).toLocaleTimeString('es-CO')} />
          </>
        ) : (
          <p className="empty">Sin datos de posición</p>
        )}
      </div>

      <div className="alerts-header">
        <span className="section-title">Alertas</span>
        {unread > 0 && <span className="unread-pill">{unread} sin leer</span>}
      </div>
      {alerts === null ? (
        <>
          <div className="skeleton alert-skeleton" />
          <div className="skeleton alert-skeleton" />
        </>
      ) : alerts.length === 0 ? (
        <div className="no-alerts">
          <Icon path={mdiCheckAll} size={32} color="#2e9e5b" />
          <p className="empty">Sin alertas</p>
        </div>
      ) : (
        alerts.map((alert) => <AlertItem key={alert.id} alert={alert} onMarkAsRead={onMarkAsRead} />)
      )}
    </div>
  );
}
