# API del servidor simulado

Base: `http://<IP-de-tu-computador>:4000`. Todas las respuestas son JSON.

Salvo `/auth/*`, todas las rutas requieren `Authorization: Bearer <accessToken>`. Sin token, o con un token inválido o expirado, responden `401`.

Usuario de prueba: `supervisor@gme.co` / `flota2026`.

## Autenticación

### `POST /auth/login`
```json
{ "email": "supervisor@gme.co", "password": "flota2026" }
```
`200`:
```json
{
  "accessToken": "…",
  "refreshToken": "…",
  "expiresIn": 60,
  "user": { "name": "Mariana Ospina", "email": "supervisor@gme.co" }
}
```
`401` si las credenciales son incorrectas.

### `POST /auth/refresh`
```json
{ "refreshToken": "…" }
```
`200` con un nuevo `accessToken`, `refreshToken` y `expiresIn`.

- El **access token dura 60 segundos**.
- El **refresh token es de un solo uso**: al refrescar recibes uno nuevo y el anterior deja de servir.
- `401` si el refresh token es inválido, ya se usó o expiró (24 h).

## Vehículos

### `GET /vehicles`
```json
{ "items": [{ "id": "veh-01", "label": "Camión 01", "plate": "TSM-482", "driver": "Carlos Henao" }] }
```

## Posiciones

### `GET /positions?since=<cursor>`
Devuelve las posiciones que llegaron al servidor después de `cursor` (máximo 200 por llamada). La primera vez usa `since=0`; después, el `cursor` de la respuesta anterior.

```json
{
  "cursor": 245,
  "updates": [
    {
      "vehicleId": "veh-03",
      "lat": 6.251873,
      "lng": -75.569120,
      "speedKmh": 42,
      "heading": 118,
      "recordedAt": "2026-10-09T15:04:12.511Z"
    }
  ]
}
```

- Los vehículos reportan cada 2 segundos.
- `recordedAt` es la hora en que **el dispositivo** tomó la posición.
- **Las posiciones pueden llegar repetidas o fuera de orden.** Cuando un dispositivo se queda sin señal, guarda sus posiciones y las reenvía al recuperarla, así que pueden llegar después de otras más recientes. A veces también reenvía una posición que ya había enviado.
- Este endpoint falla a propósito con `503` cerca del 5 % de las veces, como en una red celular real.

## Alertas

### `GET /alerts` · `GET /alerts?vehicleId=veh-03`
Alertas de la más reciente a la más antigua.
```json
{
  "items": [
    {
      "id": "al-0012",
      "vehicleId": "veh-03",
      "type": "overspeed",
      "message": "Exceso de velocidad: 84 km/h en zona de 60 km/h",
      "createdAt": "2026-10-09T15:03:58.020Z",
      "read": false
    }
  ]
}
```

### `POST /alerts/:id/read`
Marca la alerta como leída. `200` con la alerta actualizada; `404` si no existe.
