# Diseño: Detalle del vehículo y alertas

**Requisitos**: [requirements.md](requirements.md) · **Arquitectura**: [docs/arquitectura.md](../../docs/arquitectura.md)

## Resumen
Las alertas viven en el mismo store que la flota, así lista y detalle
comparten estado. `useFleetSync` agrega un segundo poller de alertas cada
10 s. Marcar como leída actualiza el store de inmediato y lo confirma o
revierte según la respuesta del servidor.

## Archivos
| Archivo | Cambio |
|---|---|
| `app/src/lib/alerts.ts` | nuevo: `unreadCountByVehicle`, `applyPendingReads` |
| `app/src/state/fleetStore.ts` | modificado: `alerts`, `pendingReads`, `setAlerts`, `markAlertRead` |
| `app/src/hooks/useFleetSync.ts` | modificado: poller de alertas (10 s) |
| `app/src/hooks/useVehicleList.ts` | modificado: `unread` desde `unreadCountByVehicle` |
| `app/src/hooks/useVehicleDetail.ts` | nuevo |
| `app/src/screens/VehicleDetailScreen.tsx` | nuevo |
| `app/src/components/AlertItem.tsx` | nuevo |
| `app/src/navigation/RootNavigator.tsx` | modificado: ruta `VehicleDetail { vehicleId }` |

## Contratos
```ts
// lib/alerts.ts
function unreadCountByVehicle(alerts: Alert[]): Record<string, number>;
function applyPendingReads(alerts: Alert[], pending: ReadonlySet<string>): Alert[];

// state/fleetStore.ts (adiciones)
alerts: Alert[];
pendingReads: Set<string>;
setAlerts(items: Alert[]): void;                    // respeta pendingReads
markAlertRead(id: string, send: (id: string) => Promise<Alert>): Promise<'ok' | 'failed'>;

// hooks/useVehicleDetail.ts
useVehicleDetail(vehicleId: string): {
  vehicle: Vehicle | undefined; position: PositionUpdate | undefined;
  secondsAgo: number | null; stale: boolean; alerts: Alert[];
  markAsRead(id: string): Promise<void>;
}
```

## Decisiones
- **D1**: Actualización optimista: `markAlertRead` marca la alerta, agrega su id a `pendingReads`, envía el `POST` y al terminar lo quita — *por qué*: el cambio se ve al instante en detalle y lista.
- **D2**: `setAlerts` aplica `pendingReads` sobre la respuesta de `GET /alerts` — *por qué*: una consulta que sale antes del `POST` traería `read: false` y desharía el cambio.
- **D3**: Fallo del `POST` revierte la alerta a sin leer y `ToastAndroid` muestra "No se pudo marcar la alerta"; `404` la retira del store — *por qué*: el estado visible siempre coincide con el servidor.
- **D4**: Las alertas del detalle salen del store filtradas por `vehicleId`, sin `GET /alerts?vehicleId` — *por qué*: el store ya las tiene y se mantienen actualizadas cada 10 s.
- **D5**: El detalle reutiliza `isStale`, `secondsSince` y `useNow` de la spec 02 — *por qué*: la lista y el detalle muestran el mismo "visto hace X s".

## Pruebas
- `alerts.test.ts`: conteo por vehículo ignora leídas; `applyPendingReads` fuerza `read: true` solo en ids pendientes.
- `fleetStore.test.ts`: `markAlertRead` éxito; fallo revierte; `404` retira; `setAlerts` durante el envío no revierte el cambio.
