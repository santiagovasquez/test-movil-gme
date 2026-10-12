# Requisitos: Sesión

**Spec**: 01-sesion · **Fecha**: 2026-10-12 · **Fuente**: README §3, API.md (Autenticación)

## Historias de usuario

### HU-1 Sesión continua (P1)
Como supervisor de flota, quiero dejar la app abierta durante horas sin que
me saque, para seguir la flota sin volver a iniciar sesión.

**Criterios de aceptación**
1. **Dado** una sesión iniciada, **cuando** el access token vence (60 s),
   **entonces** la app obtiene uno nuevo con el refresh token y el usuario
   no percibe interrupción.
2. **Dado** varias peticiones que reciben `401` al mismo tiempo, **cuando**
   se renueva la sesión, **entonces** se hace un solo `POST /auth/refresh`
   y todas las peticiones se reintentan con el token nuevo.
3. **Dado** una sesión iniciada, **cuando** el usuario cierra y vuelve a
   abrir la app, **entonces** entra directo a la lista de vehículos.

### HU-2 Sesión expirada (P1)
Como supervisor de flota, quiero saber con claridad cuándo debo volver a
iniciar sesión, para entender qué pasó.

**Criterios de aceptación**
1. **Dado** un refresh token inválido, usado o expirado, **cuando** el
   servidor responde `401` en `/auth/refresh`, **entonces** la app vuelve
   al login con el mensaje "Tu sesión expiró. Inicia sesión de nuevo."
2. **Dado** que el usuario toca "Salir", **entonces** se borran los tokens
   y se muestra el login sin mensaje de error.

## Requisitos funcionales
- **RF-1**: El access token se guarda solo en memoria, con su hora de vencimiento.
- **RF-2**: El refresh token se guarda en el almacenamiento seguro del dispositivo.
- **RF-3**: El token se renueva antes de vencer y también al recibir `401`
  en una ruta protegida; cada petición se reintenta una sola vez.
- **RF-4**: Solo existe un refresh en curso; las peticiones concurrentes esperan su resultado.
- **RF-5**: El refresh token nuevo se guarda en cuanto llega la respuesta.
- **RF-6**: Las peticiones tienen un tiempo máximo de espera.

## Casos límite
- El refresh falla por red o timeout: la sesión se conserva y se reintenta
  en la siguiente petición; solo un `401` del refresh cierra la sesión.
- La app vuelve del segundo plano con el access token vencido: se renueva
  antes de la primera petición.
- Al abrir la app con un refresh token guardado que ya expiró: login con el
  mensaje de sesión expirada.

## Fuera de alcance
- Registro de usuarios y recuperación de contraseña.
