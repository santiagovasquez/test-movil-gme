# Notas

La app se desarrolló y probó solo para **Android** (teléfono Redmi Note 8,
Android 11, con Expo Go). No se probó en iOS.

## 1. Cómo correrlo

**Requisitos:** Node 22 (`.nvmrc`; con nvm: `nvm use`), npm 10 y un
emulador Android o Expo Go.

```bash
# 1. Servidor (terminal 1)
cd mock-server
npm start                     # puerto 4000

# 2. App (terminal 2)
cd app
npm install                   # incluye las dependencias nuevas
npm test                      # pruebas
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000 npx expo start --android
```

En el emulador Android, `10.0.2.2` es el computador. En un teléfono físico
se usa la IP local del computador.

**Web (opcional):**

```bash
cd web && npm install && npm run dev   # http://localhost:5173
```

**Expo Go debe ser compatible con SDK 57.** Expo Go avisa que su próxima
versión solo abrirá proyectos SDK 58. Si la versión de la tienda ya no abre
el proyecto, hay que instalar la de SDK 57 desde
[expo.dev/go](https://expo.dev/go) o usar el emulador con
`npx expo start --android`, que instala la versión correcta.

Cada parte tiene su spec en `specs/` y la estructura está en `docs/arquitectura.md`.

## 2. Decisiones

- **Tokens:** el refresh token se guarda en `expo-secure-store`, que lo cifra
  con el Keystore de Android. El access token vive solo en memoria porque dura
  60 s; al abrir la app se pide uno nuevo con el refresh.
- **Refresh:** solo hay un refresh a la vez y las demás peticiones esperan ese
  mismo. El refresh token es de un solo uso, así que dos refresh en paralelo
  cerrarían la sesión.
- **Sesión expirada:** si el servidor rechaza el refresh, la app vuelve al
  login con "Tu sesión expiró". Si el problema es la red, la sesión se conserva.
- **Polling:** cada consulta se programa al terminar la anterior, así nunca
  hay dos al mismo tiempo. En segundo plano se detiene y al volver consulta de
  inmediato.
- **Red inestable:** los `503` y los timeouts (10 s) se reintentan sin mostrar
  nada y sin avanzar el cursor. Tras 3 fallos seguidos aparece "Reconectando…".
- **Carga inicial:** la API obliga a recorrer todo el historial desde
  `since=0`, en lotes de 200. La lista muestra un skeleton hasta estar al día,
  para no enseñar posiciones viejas, y un `503` durante ese recorrido se
  reintenta a los 300 ms en lugar de esperar 3 s. Con unas 7.000 posiciones
  tarda unos 4 s.
- **Estado:** la sesión va en un Context porque cambia poco. Vehículos,
  posiciones y alertas van en Zustand porque la lista y el detalle los
  comparten.
- **Navegación:** React Navigation (native-stack), que maneja el botón atrás de
  Android y funciona en Expo Go.
- **Mapa:** el detalle muestra la posición en vivo sobre OpenStreetMap con
  Leaflet, dentro de un WebView. Se probó primero `react-native-maps`, pero la
  API key de Google Maps que trae Expo Go no está autorizada ("Authorization
  failure" en el log) y el mapa quedaba en blanco. Con Leaflet funciona en
  Expo Go sin key: el marcador gira según el rumbo y deja la estela del
  recorrido. Necesita internet para las teselas.
- **Marcar como leída:** la alerta cambia al instante. Si el servidor falla,
  vuelve a "sin leer" y aparece un aviso; si responde `404`, se retira.
- **Web:** `web/` (Vite + React) usa la misma lógica de `app/src/lib`, sin
  copiarla. Solo cambia dónde se guardan los tokens (`localStorage`) y cómo
  se pausa el polling (al ocultar la pestaña). El diseño se rehízo en CSS
  porque los componentes de React Native no corren en el navegador.

La lógica está en `app/src/lib`, sin React, y tiene pruebas con Vitest.

## 3. Problemas en el código existente

1. **Una posición vieja reemplazaba a la actual.** `applyUpdates` se quedaba
   con la última posición que llegaba, no con la más reciente. Como los
   dispositivos reenvían posiciones atrasadas, el vehículo mostraba datos
   viejos. **Corregido:** ahora compara `recordedAt`.
2. **Las peticiones no tenían timeout.** Una petición colgada dejaba el
   polling detenido. **Corregido:** se cortan a los 10 s.
3. **Un error de red no se distinguía de un error del servidor.**
   **Corregido:** `ApiError` con `status` 0 para red o timeout.
4. **Los headers podían perderse.** Si llegaban como objeto `Headers`, el
   spread los convertía en `{}`. **Corregido.**
5. **La sesión no se renovaba.** A los 60 s todo respondía `401` y al cerrar
   la app se perdía. **Corregido** (ver Decisiones).
6. **El login no podía mostrar "sesión expirada".** Nadie le pasaba ese
   mensaje, y además cambiaba su estado después de cerrarse. **Corregido.**
7. **Sin corregir:** si una respuesta exitosa trae JSON inválido, se toma como
   un objeto vacío. Lo corregiría lanzando un error en ese caso.

## 4. Con más tiempo

- Pruebas de los hooks con React Native Testing Library.
- Si una consulta de alertas sale antes de marcar una como leída y llega
  después de la confirmación, la alerta se ve sin leer hasta la siguiente
  consulta (máximo 10 s). Lo resolvería numerando las consultas.
- **Refresh con respuesta perdida.** Si el `POST /auth/refresh` llega al
  servidor pero la respuesta no llega a la app (timeout), el servidor ya gastó
  el refresh token y la app se queda con uno inválido: el siguiente intento
  responde `401` y la sesión termina. Lo comprobé pausando el servidor
  durante 2 minutos. La app hace un solo refresh a la vez, pero no puede
  evitarlo sola porque el token es de un solo uso. Lo resolvería en el
  servidor, aceptando el token anterior durante unos segundos tras rotarlo.
- Mejorar el diseño pensando en la usabilidad para el supervisor.
- Probar en más dispositivos reales, usando la app en vertical y en horizontal.
- Medir el rendimiento de las pantallas (tiempos de carga, renders lentos,
  validaciones) para detectar anomalías.

## 5. Uso de IA

- **Herramientas:** Claude Code (Claude Opus) en la terminal.
- **Para qué:** escribir las specs (requisitos, diseño y tareas, en `specs/`)
  antes de codear y luego implementarlas fase por fase. Yo revisaba cada fase
  y aprobaba el commit.
- **Casos en que se equivocó:**
  - En `http.ts`, el timeout también podía cortar la lectura del cuerpo, y
    `response.json().catch(() => ({}))` devolvía `{}` como respuesta exitosa.
    Se detectó al revisar antes del commit y se agregó la verificación de
    `signal.aborted` con su prueba.
  - El contrato del poller en el diseño (`task: () => Promise`) no permitía
    cumplir su propia decisión D3, descartar la respuesta después de `stop()`
    sin avanzar el cursor, porque el cursor vive dentro de la tarea. Se
    detectó al implementar y se cambió a `task(isCurrent)`.
  - Recomendó `react-native-maps` para el mapa asegurando que en Expo Go
    funcionaba sin configurar nada. En el teléfono el mapa quedó en blanco; el
    log de Android mostraba "Authorization failure" de Google Maps. Se cambió
    a Leaflet con OpenStreetMap en un WebView.
  - En la web, la primera forma de leer la URL del API funcionaba en el
    build pero fallaba en `npm run dev`. Se cambió por un `config.ts` propio
    de la web.
  - Una prueba con timers falsos usaba `advanceTimersByTimeAsync(0)`, que no
    ejecuta los `setTimeout(0)` encadenados. La prueba fallaba aunque el
    código estaba bien: un recordatorio de que una prueba roja no siempre
    significa código roto.
