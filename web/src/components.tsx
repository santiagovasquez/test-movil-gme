import {
  mdiAccountOutline,
  mdiBell,
  mdiBellOutline,
  mdiCar,
  mdiCheck,
  mdiCheckCircle,
  mdiClockOutline,
  mdiMapMarkerDistance,
  mdiNavigation,
  mdiNavigationVariantOutline,
  mdiSignalOff,
  mdiSpeedometer,
  mdiTruck,
  mdiTruckOutline,
  mdiVanUtility,
} from '@mdi/js';
import { useRef } from 'react';
import { formatAgo, VehicleStatus } from '@app/lib/positions';
import type { Alert, Vehicle } from '@app/lib/types';

// Réplica en HTML/CSS de los componentes de la app (app/src/components):
// mismos colores, textos e íconos (Material Design Icons).

export const STATUS_STYLE: Record<VehicleStatus, { label: string; color: string; background: string }> = {
  moving: { label: 'En movimiento', color: '#2e9e5b', background: '#e6f6ec' },
  stopped: { label: 'Detenido', color: '#b7791f', background: '#fdf3dc' },
  stale: { label: 'Sin señal', color: '#c62828', background: '#fde8e8' },
  noData: { label: 'Sin datos', color: '#52606d', background: '#e4e7eb' },
};

export function Icon({ path, size = 16, color = 'currentColor' }: { path: string; size?: number; color?: string }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path d={path} fill={color} />
    </svg>
  );
}

export function Logo() {
  return (
    <div className="logo">
      <div className="logo-badge">
        <Icon path={mdiNavigation} size={34} color="#fff" />
      </div>
      <div className="logo-name">GME Flota</div>
      <div className="logo-tagline">Supervisión de vehículos</div>
    </div>
  );
}

/** Ícono según el tipo que indica el nombre ("Camión 01", "Furgón 03"). */
function iconFor(label: string): string {
  const name = label.toLowerCase();
  if (name.startsWith('cami')) return mdiTruck;
  if (name.startsWith('furg')) return mdiVanUtility;
  return mdiCar;
}

export function VehicleIcon({ label, status, size = 46 }: { label: string; status: VehicleStatus; size?: number }) {
  const { color, background } = STATUS_STYLE[status];
  return (
    <div className="vehicle-icon" style={{ background, width: size, height: size }}>
      <Icon path={iconFor(label)} size={size * 0.52} color={color} />
    </div>
  );
}

export function StatusChip({ status }: { status: VehicleStatus }) {
  const { label, color, background } = STATUS_STYLE[status];
  return (
    <span className="chip" style={{ background, color }}>
      <span className="dot" style={{ background: color }} />
      {label}
    </span>
  );
}

export interface VehicleRowModel {
  vehicle: Vehicle;
  status: VehicleStatus;
  speedKmh: number | null;
  secondsAgo: number | null;
  distanceKm: number;
  unread: number;
}

export function VehicleCard({
  vehicle,
  status,
  speedKmh,
  secondsAgo,
  distanceKm,
  unread,
  selected,
  onPress,
}: VehicleRowModel & { selected: boolean; onPress(): void }) {
  return (
    <button className={`card vehicle-card${selected ? ' selected' : ''}`} onClick={onPress}>
      <div className="card-top">
        <VehicleIcon label={vehicle.label} status={status} />
        <div className="titles">
          <div className="title-line">
            <span className="vehicle-label">{vehicle.label}</span>
            <StatusChip status={status} />
          </div>
          <div className="subtitle">
            <span className="plate">{vehicle.plate}</span>
            <Icon path={mdiAccountOutline} size={12} color="#7b8794" />
            <span className="driver">{vehicle.driver}</span>
          </div>
        </div>
      </div>
      <div className="divider" />
      <div className="metrics">
        <span className="metric">
          <Icon path={mdiSpeedometer} color="#1b5e9c" />
          {speedKmh === null ? '—' : `${speedKmh} km/h`}
        </span>
        <span className="metric">
          <Icon path={mdiMapMarkerDistance} color="#1b5e9c" />
          {`${distanceKm.toFixed(1)} km`}
        </span>
        <span className="metric">
          <Icon path={mdiClockOutline} size={15} color="#1b5e9c" />
          {secondsAgo === null ? '—' : formatAgo(secondsAgo)}
        </span>
        {unread > 0 && (
          <span className="unread">
            <Icon path={mdiBell} size={13} color="#c05621" />
            {unread}
          </span>
        )}
      </div>
    </button>
  );
}

export function VehicleCardSkeleton() {
  return (
    <div className="card">
      <div className="card-top">
        <div className="skeleton" style={{ width: 46, height: 46, borderRadius: 23 }} />
        <div className="titles">
          <div className="skeleton" style={{ width: '55%', height: 16 }} />
          <div className="skeleton" style={{ width: '75%', height: 12 }} />
        </div>
      </div>
      <div className="divider" />
      <div className="metrics">
        <div className="skeleton" style={{ width: 70, height: 12 }} />
        <div className="skeleton" style={{ width: 60, height: 12 }} />
        <div className="skeleton" style={{ width: 60, height: 12 }} />
      </div>
    </div>
  );
}

export interface FleetSummary {
  total: number;
  moving: number;
  stale: number;
  unread: number;
}

function Tile({ icon, value, label, color }: { icon: string; value: number; label: string; color: string }) {
  return (
    <div className="tile">
      <div className="tile-top">
        <Icon path={icon} size={18} color={color} />
        <span className="tile-value" style={{ color }}>
          {value}
        </span>
      </div>
      <span className="tile-label">{label}</span>
    </div>
  );
}

/** Resumen de la flota sobre la lista. */
export function FleetSummaryBar({ summary }: { summary: FleetSummary }) {
  return (
    <div className="summary">
      <Tile icon={mdiTruckOutline} value={summary.total} label="Vehículos" color="#1b5e9c" />
      <Tile icon={mdiNavigationVariantOutline} value={summary.moving} label="En ruta" color="#2e9e5b" />
      <Tile icon={mdiSignalOff} value={summary.stale} label="Sin señal" color="#c62828" />
      <Tile icon={mdiBellOutline} value={summary.unread} label="Alertas" color="#c05621" />
    </div>
  );
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'medium' });

export function AlertItem({ alert, onMarkAsRead }: { alert: Alert; onMarkAsRead(id: string): void }) {
  // Solo se anima si la alerta se marca mientras está en pantalla.
  const initiallyRead = useRef(alert.read).current;

  return (
    <div className={`alert ${alert.read ? 'read' : 'unread'}`}>
      <p className="alert-message">{alert.message}</p>
      <div className="alert-footer">
        <span className="meta">{formatDate(alert.createdAt)}</span>
        {alert.read ? (
          <span className={`read-badge${initiallyRead ? '' : ' pop'}`}>
            <Icon path={mdiCheckCircle} color="#2e9e5b" />
            Leída
          </span>
        ) : (
          <button className="action" onClick={() => onMarkAsRead(alert.id)}>
            <Icon path={mdiCheck} color="#1b5e9c" />
            Marcar como leída
          </button>
        )}
      </div>
    </div>
  );
}

export function StatTile({ icon, label, value, unit }: { icon: React.ReactNode; label: string; value: string; unit?: string }) {
  return (
    <div className="card stat-tile">
      <div className="stat-icon">{icon}</div>
      <span className="stat-label">{label}</span>
      <span className="stat-value">
        {value}
        {unit && <span className="stat-unit"> {unit}</span>}
      </span>
    </div>
  );
}

export function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <span className="field-value">{value}</span>
    </div>
  );
}
