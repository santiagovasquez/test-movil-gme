# Requisitos: Detalle del vehículo y alertas

**Spec**: 03-detalle-alertas · **Fecha**: 2026-10-12 · **Fuente**: README §2, API.md (Alertas)

## Historias de usuario

### HU-1 Detalle del vehículo (P1)
Como supervisor de flota, quiero ver el detalle de un vehículo, para revisar
su estado y lo que le ha pasado.

**Criterios de aceptación**
1. **Dado** la lista, **cuando** el usuario toca un vehículo, **entonces**
   se abre su detalle con nombre, placa y conductor.
2. **Dado** el detalle abierto, **entonces** muestra la última posición
   (latitud, longitud, velocidad, rumbo, hora de registro y "visto hace X s")
   y se actualiza en vivo.
3. **Dado** el detalle abierto, **entonces** muestra las alertas del
   vehículo de la más reciente a la más antigua, diferenciando leídas y no leídas.
4. **Dado** el detalle abierto, **cuando** el usuario usa el botón atrás de
   Android, **entonces** vuelve a la lista.

### HU-2 Marcar alerta como leída (P1)
Como supervisor de flota, quiero marcar una alerta como leída, para llevar
control de lo que ya revisé.

**Criterios de aceptación**
1. **Dado** una alerta sin leer, **cuando** el usuario la marca como leída,
   **entonces** cambia a leída de inmediato en el detalle.
2. **Dado** una alerta marcada como leída, **cuando** el usuario vuelve a la
   lista, **entonces** el contador de no leídas del vehículo ya refleja el cambio.
3. **Dado** que `POST /alerts/:id/read` falla, **entonces** la alerta vuelve
   a "sin leer" y se muestra un mensaje breve.

## Requisitos funcionales
- **RF-1**: `GET /alerts` se consulta cada 10 s mientras la app está en
  primer plano, para detectar alertas nuevas.
- **RF-2**: La lista y el detalle comparten el mismo estado de alertas.
- **RF-3**: Una alerta marcada como leída no vuelve a "sin leer" por una
  respuesta de `GET /alerts` que llegue mientras se confirma el cambio.

## Casos límite
- Un vehículo sin alertas: el detalle muestra "Sin alertas".
- Un vehículo sin posición recibida: el detalle muestra "Sin datos de posición".
- `POST /alerts/:id/read` responde `404`: la alerta se retira de la lista.

## Fuera de alcance
- Mapa del vehículo.
- Notificaciones push de alertas nuevas.
