# Diseño: Sesión

**Requisitos**: [requirements.md](requirements.md) · **Arquitectura**: [docs/arquitectura.md](../../docs/arquitectura.md)

## Resumen
`session.ts` mantiene el access token en memoria y lo renueva con un solo
refresh a la vez. `http.ts` agrega el token a cada petición, aplica timeout y,
ante un `401`, pide un token nuevo y reintenta una vez. `SessionProvider`
expone el estado de sesión a la app.

## Archivos
| Archivo | Cambio |
|---|---|
| `app/src/lib/types.ts` | modificado: `User`, `TokenResponse`, `LoginResponse` (reemplaza `Session`) |
| `app/src/lib/http.ts` | nuevo: `request` sin auth (timeout) y `createHttpClient` con auth |
| `app/src/lib/api.ts` | modificado: `authApi` (login, refresh) y `createApi(http)` para rutas protegidas |
| `app/src/lib/session.ts` | nuevo: `createSessionManager`, `TokenStorage`, `SessionExpiredError` |
| `app/src/storage/tokenStorage.ts` | nuevo: `TokenStorage` con `expo-secure-store` |
| `app/src/state/SessionProvider.tsx` | nuevo: contexto + `useSession()` |
| `app/src/screens/LoginScreen.tsx` | modificado: usa `useSession()` y muestra `notice` |
| `app/App.tsx` | modificado: `SessionProvider`; cargando / login / vehículos según `status` |

## Contratos
```ts
// lib/http.ts
class ApiError extends Error { status: number }       // status 0 = red o timeout
function request<T>(path: string, init?: RequestInit, timeoutMs?: number): Promise<T>
function createHttpClient(deps: { session: SessionManager; timeoutMs?: number }):
  { get<T>(path: string): Promise<T>; post<T>(path: string, body?: unknown): Promise<T> }

// lib/session.ts
interface StoredSession { refreshToken: string; user: User }
interface TokenStorage { load(): Promise<StoredSession | null>; save(s: StoredSession): Promise<void>; clear(): Promise<void> }
class SessionExpiredError extends Error {}
function createSessionManager(deps: { storage: TokenStorage; auth: AuthApi; now?: () => number }): {
  restore(): Promise<User | null>;                 // null = sin sesión guardada o expirada
  login(email: string, password: string): Promise<User>;
  logout(): Promise<void>;
  getAccessToken(): Promise<string>;               // renueva si faltan < 10 s
  refreshAfterReject(rejected: string): Promise<string>;
  onExpired(listener: () => void): () => void;
}

// state/SessionProvider.tsx
useSession(): { status: 'restoring' | 'signedOut' | 'signedIn'; user: User | null;
  notice: string | null; api: Api; login(e: string, p: string): Promise<void>; logout(): Promise<void> }
```

## Decisiones
- **D1**: Un solo refresh en curso: la promesa se comparte entre todos los que piden token — *por qué*: el refresh token es de un solo uso; un segundo refresh paralelo recibiría `401` y cerraría la sesión.
- **D2**: `refreshAfterReject(rejected)` solo refresca si `rejected` sigue siendo el token actual — *por qué*: varias peticiones con `401` del mismo token producen un único refresh.
- **D3**: Renovación anticipada con margen de 10 s — *por qué*: evita la mayoría de `401` y el reintento que implican.
- **D4**: Error de red en el refresh conserva la sesión; solo `401` emite `onExpired` y limpia el almacenamiento — *por qué*: RF de red inestable; perder la sesión por un timeout obliga a un login innecesario.
- **D5**: `restore()` intenta un refresh al abrir la app; si falla por red, entra con el usuario guardado y renueva en la siguiente petición — *por qué*: la app abre aunque no haya red.
- **D6**: Timeout de 10 s con `AbortController` en todas las peticiones — *por qué*: un `fetch` sin respuesta deja el polling detenido.
- **D7**: `LoginScreen` solo actualiza su estado de carga si el login falla — *por qué*: al iniciar sesión el componente se desmonta.

## Pruebas
- `session.test.ts`: renueva con < 10 s; refresh concurrente → 1 llamada; `refreshAfterReject` con token viejo no refresca; `401` en refresh → limpia y emite expirado; error de red conserva sesión; guarda el refresh token nuevo; `restore` con y sin sesión guardada.
- `http.test.ts`: agrega `Bearer`; `401` → refresca y reintenta una vez; segundo `401` → error; timeout → `ApiError` status 0.
