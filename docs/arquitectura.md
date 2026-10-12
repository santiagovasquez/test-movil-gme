# Arquitectura

La lógica de sesión, polling, posiciones y alertas está en `lib/`, en
TypeScript sin dependencias de React, y se prueba con Vitest. Las pantallas
obtienen sus datos y acciones de hooks.

## Estructura

```
app/src/
  config.ts
  lib/                  Lógica sin React, probada con Vitest
    types.ts            Tipos del contrato (API.md)
    api.ts              Endpoints
    http.ts             fetch con timeout, token y reintento tras refrescar
    session.ts          Manejo de tokens y refresh (uno solo a la vez)
    positions.ts        Última posición de cada vehículo, ignorando repetidas o atrasadas
    poller.ts           Consulta de posiciones cada 3 s con cursor
    alerts.ts           Alertas sin leer por vehículo
  storage/
    tokenStorage.ts     Guarda el refresh token con expo-secure-store
  state/
    SessionProvider.tsx Sesión disponible en toda la app
    fleetStore.ts       Vehículos, posiciones y alertas (Zustand)
  hooks/
    useFleetSync.ts     Inicia y pausa el polling según la app esté al frente o no
    useNow.ts           Reloj de 1 s para "visto hace X s"
    useVehicleList.ts   Datos y acciones de la lista
    useVehicleDetail.ts Datos y acciones del detalle
  screens/              Login, Vehículos, Detalle
  components/           VehicleRow, AlertItem, NetworkBanner
  navigation/           Login | Vehículos → Detalle
```

## Cómo se conecta

- Cada pantalla usa su hook (`useVehicleList`, `useVehicleDetail`) y solo
  se encarga de mostrar.
- Los hooks leen del store y llaman a `lib/`.
- `lib/` no importa React ni Expo. Para guardar tokens recibe un objeto con
  `get/set/clear`; en la app es secure-store y en los tests un objeto en memoria.

```
poller (cada 3 s) → api → http (token vigente o refresh)
   └→ fleetStore → applyUpdates → VehicleRow se actualiza
```

## Decisiones

| Tema | Decisión | Por qué |
|---|---|---|
| Navegación | React Navigation (native-stack) | Maneja el botón atrás de Android y funciona en Expo Go |
| Datos de flota | Zustand | La lista y el detalle comparten alertas, y con selectores cada fila solo se redibuja si cambia su vehículo |
| Sesión | Context | Cambia solo al iniciar o cerrar sesión |
| Tokens | Refresh en `expo-secure-store`, access solo en memoria | El refresh se mantiene al cerrar la app; el access dura 60 s y se obtiene de nuevo con el refresh |
| Polling | `setTimeout` encadenado | Nunca hay dos consultas al mismo tiempo, aunque una tarde más de 3 s |
