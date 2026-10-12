# Diseño: Vehículos en vivo

**Requisitos**: [requirements.md](requirements.md) · **Arquitectura**: [docs/arquitectura.md](../../docs/arquitectura.md)

## Resumen
Un poller genérico ejecuta una tarea cada N ms sin solaparse. La tarea de
posiciones guarda el cursor y aplica los lotes al store con `applyUpdates`,
que ahora descarta posiciones repetidas o atrasadas. `useFleetSync` pausa y
reanuda el poller según el estado de la app.

## Archivos
| Archivo | Cambio |
|---|---|
| `app/src/lib/positions.ts` | modificado: `applyUpdates` compara `recordedAt`; nuevo `isStale` |
| `app/src/lib/poller.ts` | nuevo: `createPoller`, `createPositionsTask` |
| `app/src/state/fleetStore.ts` | nuevo: store Zustand (vehículos, posiciones, estado de red) |
| `app/src/hooks/useFleetSync.ts` | nuevo: carga vehículos, poller de posiciones, `AppState` |
| `app/src/hooks/useNow.ts` | nuevo: `Date.now()` cada 1 s |
| `app/src/hooks/useVehicleList.ts` | nuevo: filas listas para mostrar |
| `app/src/screens/VehiclesScreen.tsx` | modificado: `FlatList` + banner |
| `app/src/components/VehicleRow.tsx`, `NetworkBanner.tsx` | nuevos |
| `app/src/navigation/RootNavigator.tsx` | nuevo: Login \| Vehículos (native-stack) |
| `app/App.tsx` | modificado: `NavigationContainer` + `RootNavigator` |

## Contratos
```ts
// lib/positions.ts
const STALE_AFTER_S = 30;
function isStale(recordedAt: string, now?: number): boolean;

// lib/poller.ts
function createPoller(opts: {
  task: (isCurrent: () => boolean) => Promise<{ again: boolean }>; // again = repetir sin esperar; isCurrent false tras stop()
  intervalMs: number;
  onStatusChange?: (s: 'ok' | 'reconnecting') => void;
  failuresBeforeWarning?: number;                   // default 3
}): { start(): void; stop(): void };
function createPositionsTask(deps: {
  fetchPositions: (since: number) => Promise<{ cursor: number; updates: PositionUpdate[] }>;
  onUpdates: (updates: PositionUpdate[]) => void;
}): PollTask;

// hooks/useVehicleList.ts
interface VehicleRowModel { vehicle: Vehicle; speedKmh: number | null;
  secondsAgo: number | null; stale: boolean; unread: number }
useVehicleList(): { rows: VehicleRowModel[]; loading: boolean; network: 'ok' | 'reconnecting' }
```

## Decisiones
- **D1**: `applyUpdates` ignora una posición si su `recordedAt` es igual o anterior a la guardada — *por qué*: el servidor reenvía posiciones repetidas y atrasadas; sin esto, una posición vieja pisa a la actual.
- **D2**: `setTimeout` encadenado: la siguiente consulta se programa al terminar la anterior — *por qué*: nunca hay dos consultas simultáneas.
- **D3**: `stop()` cancela el temporizador e invalida la consulta en curso con un contador de generación; su resultado se descarta sin avanzar el cursor — *por qué*: al volver del segundo plano no quedan ciclos duplicados ni se pierden posiciones.
- **D4**: Un error mantiene el cursor y reintenta al siguiente intervalo; tras 3 fallos seguidos el estado pasa a `reconnecting` — *por qué*: el `503` del 5 % es normal y no debe mostrarse.
- **D5**: Si llegan 200 posiciones (`again: true`) se consulta de inmediato — *por qué*: tras un rato en segundo plano el atraso se recupera rápido.
- **D5b**: Mientras se pone al día (sin respuesta aún o último lote lleno), un error reintenta a los 300 ms hasta el aviso de 3 fallos — *por qué*: con decenas de lotes, cada `503` costaba 3 s y la carga inicial tardaba más de 10 s.
- **D6**: `SessionExpiredError` detiene el poller — *por qué*: la sesión ya terminó y `SessionProvider` lleva al login.
- **D7**: Un solo reloj (`useNow`) en `useVehicleList` calcula `secondsAgo` de todas las filas — *por qué*: un intervalo por fila es innecesario.
- **D8**: El store se crea con `zustand/vanilla` y se lee con `useStore` — *por qué*: se prueba sin React y se limpia con `reset()` al cerrar sesión.

## Pruebas
- `positions.test.ts`: posición atrasada no reemplaza; repetida no reemplaza; desorden dentro del lote; `isStale` en 30 s y 31 s.
- `fleetStore.test.ts`: aplica posiciones ignorando atrasadas; no notifica si no hay cambios; `reset`.
- `poller.test.ts` (timers falsos): `since=0` y luego cursor; no hay solape si la consulta tarda; error conserva cursor; `reconnecting` tras 3 fallos y vuelta a `ok`; `again` repite de inmediato; `stop` descarta la respuesta en curso; `start` doble no duplica.
