# Requisitos: Vehículos en vivo

**Spec**: 02-vehiculos-en-vivo · **Fecha**: 2026-10-12 · **Fuente**: README §1 y §4, API.md (Vehículos, Posiciones)

## Historias de usuario

### HU-1 Lista en vivo (P1)
Como supervisor de flota, quiero ver todos los vehículos con su estado
actual, para saber dónde está y cómo va cada uno.

**Criterios de aceptación**
1. **Dado** la lista abierta, **entonces** cada vehículo muestra nombre,
   placa, conductor, velocidad actual y "visto hace X s".
2. **Dado** la lista abierta, **cuando** pasa un segundo, **entonces**
   "visto hace X s" se actualiza sin intervención del usuario.
3. **Dado** un vehículo sin reportar hace más de 30 s, **entonces** la fila
   lo marca de forma visible como "Sin señal".
4. **Dado** un vehículo con alertas sin leer, **entonces** la fila muestra
   la cantidad.

### HU-2 Datos confiables con red inestable (P1)
Como supervisor de flota, quiero que la lista siga funcionando aunque la red
falle, para no perder información ni ver errores a cada rato.

**Criterios de aceptación**
1. **Dado** un `503` o un timeout en `GET /positions`, **entonces** la app
   reintenta sin mostrar error y sin perder posiciones.
2. **Dado** 3 fallos seguidos, **entonces** se muestra un aviso discreto
   "Reconectando…" que desaparece con la siguiente respuesta exitosa.
3. **Dado** una posición repetida o con `recordedAt` anterior a la actual,
   **entonces** no reemplaza a la posición más reciente del vehículo.

### HU-3 Regreso del segundo plano (P1)
Como supervisor de flota, quiero que al volver a la app los datos se
actualicen de inmediato, para no ver información vieja.

**Criterios de aceptación**
1. **Dado** la app en segundo plano, **entonces** no se consultan posiciones.
2. **Dado** que la app vuelve al primer plano, **entonces** consulta de
   inmediato y continúa cada 3 s, sin consultas acumuladas ni simultáneas.

## Requisitos funcionales
- **RF-1**: `GET /vehicles` se consulta al entrar a la lista.
- **RF-2**: `GET /positions?since=<cursor>` se consulta cada 3 s, empezando
  en `since=0` y usando el `cursor` de la última respuesta exitosa.
- **RF-3**: Nunca hay más de una consulta de posiciones en curso.
- **RF-4**: Si una respuesta trae 200 posiciones, se consulta de nuevo de
  inmediato hasta ponerse al día.
- **RF-5**: El cursor solo avanza con respuestas exitosas.

## Casos límite
- Un vehículo sin ninguna posición recibida: se muestra con "Sin datos".
- Un `401` en el polling: se resuelve según la spec 01-sesion.

## Fuera de alcance
- Mapa con todos los vehículos.
