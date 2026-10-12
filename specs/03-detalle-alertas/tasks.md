# Tareas: Detalle del vehículo y alertas

**Diseño**: [design.md](design.md)

## Fase 1 — Alertas en el store
Commit: `feat(alertas): alertas compartidas y marcado optimista como leídas`
- [x] T01 `app/src/lib/alerts.ts`: `unreadCountByVehicle`, `applyPendingReads`.
- [x] T02 `app/src/lib/alerts.test.ts`.
- [x] T03 `app/src/state/fleetStore.ts`: `alerts`, `pendingReads`, `setAlerts`, `markAlertRead` (D1–D3).
- [x] T04 `app/src/state/fleetStore.test.ts`: casos de `design.md` § Pruebas.

## Fase 2 — Sincronización y contador en la lista
Commit: `feat(alertas): consultar alertas y mostrar no leídas por vehículo`
- [x] T05 `app/src/hooks/useFleetSync.ts`: poller de alertas cada 10 s.
- [x] T06 `app/src/hooks/useVehicleList.ts` y `VehicleRow.tsx`: contador `unread`.

## Fase 3 — Detalle del vehículo
Commit: `feat(detalle): detalle del vehículo con su posición y alertas`
- [x] T07 `app/src/hooks/useVehicleDetail.ts` (D4–D5).
- [x] T08 `app/src/components/AlertItem.tsx`: leída / sin leer, botón "Marcar como leída".
- [x] T09 `app/src/screens/VehicleDetailScreen.tsx`: datos, última posición, alertas, estados vacíos.
- [x] T10 `app/src/navigation/RootNavigator.tsx` y `VehiclesScreen.tsx`: ruta `VehicleDetail` al tocar una fila.

## Verificación manual
- [ ] Tocar un vehículo abre su detalle; el back de Android vuelve a la lista.
- [ ] Posición y "visto hace X s" se actualizan en el detalle.
- [ ] Marcar alerta como leída: cambia al instante y el contador de la lista baja.
- [ ] Con el mock-server detenido, marcar como leída: revierte y muestra el aviso.
