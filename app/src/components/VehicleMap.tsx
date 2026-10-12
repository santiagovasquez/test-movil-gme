import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { VehicleStatus } from '../lib/positions';
import { PositionUpdate } from '../lib/types';
import { STATUS_STYLE } from './VehicleBadges';

/**
 * Mapa de OpenStreetMap con Leaflet dentro de un WebView: funciona en Expo Go
 * sin API key (la de Google Maps que trae Expo Go no está autorizada).
 * La página se carga una vez; cada posición nueva se envía con `update(...)`.
 */
function mapHtml(lat: number, lng: number): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { margin: 0; height: 100%; background: #e4e7eb; }
  .pin { width: 30px; height: 30px; border-radius: 50%; border: 3px solid #fff;
         box-shadow: 0 1px 4px rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; }
  .pin svg { width: 16px; height: 16px; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  // Sin arrastre para no competir con el scroll de la pantalla; el zoom sí funciona.
  var map = L.map('map', { dragging: false, zoomControl: false, attributionControl: true })
    .setView([${lat}, ${lng}], 16);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '© OpenStreetMap'
  }).addTo(map);
  var trail = L.polyline([], { color: '#1b5e9c', weight: 4, opacity: 0.6 }).addTo(map);
  var marker = null;

  function icon(heading, color) {
    return L.divIcon({
      className: '',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      html: '<div class="pin" style="background:' + color + '">' +
        '<svg viewBox="0 0 24 24" style="transform: rotate(' + heading + 'deg)">' +
        '<path fill="#fff" d="M12 2 L20 21 L12 16 L4 21 Z"/></svg></div>'
    });
  }

  window.update = function (lat, lng, heading, color) {
    var point = [lat, lng];
    if (!marker) marker = L.marker(point).addTo(map);
    marker.setLatLng(point).setIcon(icon(heading, color));
    trail.addLatLng(point);
    var points = trail.getLatLngs();
    if (points.length > 60) trail.setLatLngs(points.slice(-60));
    map.panTo(point, { animate: true });
  };
</script>
</body>
</html>`;
}

export function VehicleMap({ position, status }: { position: PositionUpdate; status: VehicleStatus }) {
  const webRef = useRef<WebView>(null);
  const loaded = useRef(false);
  // La página se arma solo con la primera posición: cambiarla recargaría el mapa.
  const initial = useRef(position).current;
  const html = useMemo(() => mapHtml(initial.lat, initial.lng), [initial]);
  const { color } = STATUS_STYLE[status];

  const script = `window.update && window.update(${position.lat}, ${position.lng}, ${position.heading}, '${color}'); true;`;

  useEffect(() => {
    if (loaded.current) webRef.current?.injectJavaScript(script);
  }, [script]);

  return (
    <View style={[styles.container, { borderColor: color }]}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.web}
        scrollEnabled={false}
        onLoadEnd={() => {
          loaded.current = true;
          webRef.current?.injectJavaScript(script);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 220,
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: '#e4e7eb',
  },
  web: { backgroundColor: 'transparent' },
});
