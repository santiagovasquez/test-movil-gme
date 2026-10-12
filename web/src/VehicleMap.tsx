import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import type { VehicleStatus } from '@app/lib/positions';
import type { PositionUpdate } from '@app/lib/types';
import { STATUS_STYLE } from './components';

const MAX_TRAIL_POINTS = 60;

function pinIcon(heading: number, color: string) {
  return L.divIcon({
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html:
      `<div class="pin" style="background:${color}">` +
      `<svg viewBox="0 0 24 24" style="transform: rotate(${heading}deg)">` +
      '<path fill="#fff" d="M12 2 L20 21 L12 16 L4 21 Z"/></svg></div>',
  });
}

/**
 * Mapa de OpenStreetMap con Leaflet, igual al de la app (VehicleMap.tsx) pero
 * sin WebView: el mapa se crea una vez y cada posición nueva mueve el marcador.
 */
export function VehicleMap({ position, status }: { position: PositionUpdate; status: VehicleStatus }) {
  const container = useRef<HTMLDivElement>(null);
  const layers = useRef<{ map: L.Map; marker: L.Marker; trail: L.Polyline } | null>(null);
  const { color } = STATUS_STYLE[status];

  useEffect(() => {
    // Con la rueda se desplaza el panel; el zoom queda en los botones.
    const map = L.map(container.current!, { scrollWheelZoom: false }).setView([position.lat, position.lng], 16);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(map);
    const trail = L.polyline([], { color: '#1b5e9c', weight: 4, opacity: 0.6 }).addTo(map);
    const marker = L.marker([position.lat, position.lng]).addTo(map);
    layers.current = { map, marker, trail };
    return () => {
      map.remove();
      layers.current = null;
    };
    // Se crea solo con la primera posición; las siguientes se aplican abajo.
  }, []);

  useEffect(() => {
    if (!layers.current) return;
    const { map, marker, trail } = layers.current;
    const point = L.latLng(position.lat, position.lng);
    marker.setLatLng(point).setIcon(pinIcon(position.heading, color));
    trail.addLatLng(point);
    const points = trail.getLatLngs() as L.LatLng[];
    if (points.length > MAX_TRAIL_POINTS) trail.setLatLngs(points.slice(-MAX_TRAIL_POINTS));
    map.panTo(point, { animate: true });
  }, [position.lat, position.lng, position.heading, color]);

  return <div ref={container} className="map" style={{ borderColor: color }} />;
}
