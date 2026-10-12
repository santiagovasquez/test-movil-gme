# Tareas: Vehículos en vivo

**Diseño**: [design.md](design.md)

## Fase 1 — Posiciones repetidas o atrasadas
Commit: `fix(posiciones): descartar posiciones repetidas o atrasadas`
- [x] T01 `app/src/lib/positions.ts`: `applyUpdates` compara `recordedAt` (D1); agregar `STALE_AFTER_S` e `isStale`.
- [x] T02 `app/src/lib/positions.test.ts`: casos nuevos de `design.md` § Pruebas.

## Fase 2 — Poller
Commit: `feat(polling): consultar posiciones con cursor sin solapes ni pérdidas`
- [x] T03 `app/src/lib/poller.ts`: `createPoller` y `createPositionsTask` (D2–D6).
- [x] T04 `app/src/lib/poller.test.ts`: casos de `design.md` § Pruebas con timers falsos.

## Fase 3 — Store y sincronización
Commit: `feat(flota): store de flota y sincronización según el estado de la app`
- [x] T05 `npx expo install zustand`.
- [x] T06 `app/src/state/fleetStore.ts`: vehículos, posiciones, `network`, `reset()` (D8).
- [x] T07 `app/src/hooks/useFleetSync.ts`: carga vehículos, poller de posiciones, `AppState`.
- [x] T08 `app/src/hooks/useNow.ts`.

## Fase 4 — Lista y navegación
Commit: `feat(vehiculos): lista de vehículos en vivo`
- [x] T09 `npx expo install @react-navigation/native @react-navigation/native-stack react-native-screens`.
- [x] T10 `app/src/hooks/useVehicleList.ts` (D7).
- [x] T11 `app/src/components/VehicleRow.tsx`, `NetworkBanner.tsx`: "Sin señal", "Sin datos", "Reconectando…".
- [x] T12 `app/src/screens/VehiclesScreen.tsx`: `FlatList`, banner, "Salir" en el header.
- [x] T13 `app/src/navigation/RootNavigator.tsx` y `app/App.tsx`: `NavigationContainer`.

## Verificación manual
- [ ] 8 vehículos con velocidad y "visto hace X s" actualizándose cada segundo.
- [ ] Algún vehículo pasa a "Sin señal" y vuelve al recuperar señal.
- [ ] Los `503` del servidor no muestran errores en la app.
- [ ] Segundo plano 1 min y regreso: datos al día, sin consultas simultáneas en el log del servidor.
