# Tareas: Sesión

**Diseño**: [design.md](design.md)

## Fase 1 — Manejo de tokens
Commit: `feat(sesion): renovar el access token con un solo refresh a la vez`
- [ ] T01 `app/src/lib/types.ts`: agregar `User`, `TokenResponse`, `LoginResponse`.
- [ ] T02 `app/src/lib/session.ts`: `createSessionManager`, `TokenStorage`, `SessionExpiredError` (D1–D5).
- [ ] T03 `app/src/lib/session.test.ts`: casos de `design.md` § Pruebas.

## Fase 2 — Cliente HTTP con timeout y reintento
Commit: `feat(api): timeout y reintento tras 401 en las peticiones`
- [ ] T04 `app/src/lib/http.ts`: `ApiError` (status 0 en red/timeout), `request` con `AbortController`, `createHttpClient` (D6).
- [ ] T05 `app/src/lib/api.ts`: `authApi` (login, refresh) y `createApi(http)`; ajustar imports de `LoginScreen`.
- [ ] T06 `app/src/lib/http.test.ts`: casos de `design.md` § Pruebas.

## Fase 3 — Sesión en la app
Commit: `feat(sesion): persistir la sesión y volver al login al expirar`
- [ ] T07 `npx expo install expo-secure-store`.
- [ ] T08 `app/src/storage/tokenStorage.ts`: `TokenStorage` con secure-store.
- [ ] T09 `app/src/state/SessionProvider.tsx`: contexto, `useSession()`, `notice` al expirar.
- [ ] T10 `app/src/screens/LoginScreen.tsx`: usar `useSession()`, mostrar `notice` (D7).
- [ ] T11 `app/App.tsx`: `SessionProvider`; indicador mientras `restoring`.

## Verificación manual
- [ ] Login correcto e incorrecto.
- [ ] App abierta más de 2 min: sigue en la lista y el servidor registra `POST /auth/refresh`.
- [ ] Cerrar y abrir la app: entra sin login.
- [ ] Reiniciar el mock-server con la app abierta: vuelve al login con el mensaje de sesión expirada.
- [ ] "Salir": login sin mensaje.
