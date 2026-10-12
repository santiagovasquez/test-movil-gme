# Prueba práctica — Ingeniero(a) Web y Móvil (React Native + React)

**GME International · Medellín · octubre 2026**

Gracias por llegar hasta aquí. Esta prueba se parece al trabajo del día a día en el cargo: tomar una app que ya existe, entender cómo habla con el backend, extenderla y dejarla mejor de lo que estaba.

## Contexto

Nuestra plataforma recibe telemetría de vehículos con dispositivos GPS. Los supervisores de flota usan una app móvil para ver dónde está cada vehículo, si sigue reportando y qué alertas tiene.

Este repositorio tiene dos partes:

- `mock-server/`: un servidor que simula la plataforma. Los vehículos se mueven por Medellín, generan alertas y la red se comporta como una red celular real. **Lee [`mock-server/API.md`](mock-server/API.md) con atención: el contrato importa.**
- `app/`: la app en Expo (SDK 57) + TypeScript. El login ya funciona. La pantalla de vehículos está vacía.

## Cómo correrlo

Necesitas Node.js 20 o superior y la app **Expo Go** en tu teléfono (o un emulador Android / simulador iOS).

```bash
cd mock-server
npm start                        # servidor en el puerto 4000; no tiene dependencias

cd ../app
npm install
npm test                         # las pruebas existentes deben pasar
EXPO_PUBLIC_API_URL=http://<IP-de-tu-computador>:4000 npx expo start
```

El teléfono y el computador deben estar en la misma red Wi-Fi. Desde el teléfono, `localhost` es el propio teléfono, así que usa la IP local del computador.

Usuario: `supervisor@gme.co` · contraseña: `flota2026`.

## Lo que te pedimos

### 1. Lista de vehículos en vivo
- Muestra todos los vehículos con nombre, placa, conductor, velocidad actual y "visto hace X s", que debe actualizarse solo.
- Consulta `GET /positions` cada 3 segundos con el cursor, como dice `API.md`. La lógica para mantener la última posición de cada vehículo ya existe en `app/src/lib/positions.ts`.
- Marca de forma visible un vehículo que lleva más de 30 segundos sin reportar.
- Indica cuántas alertas sin leer tiene cada vehículo.

### 2. Detalle del vehículo
- Al tocar un vehículo: sus datos, su última posición y sus alertas.
- Permite marcar una alerta como leída. La lista debe reflejar el cambio.
- El mapa es **opcional**. Si lo agregas, usa algo que funcione en Expo Go.

### 3. Sesión
- El access token dura **60 segundos** y el refresh token es **de un solo uso** (ver `API.md`). El supervisor debe poder dejar la app abierta horas sin que lo saque ni pierda datos.
- Si la sesión ya no se puede renovar, vuelve al login con un mensaje claro.
- Decide dónde guardas los tokens y explícalo en `NOTAS.md`.

### 4. Red inestable
- `GET /positions` falla a propósito cerca del 5 % de las veces. La app no debe romperse, mostrar errores a cada rato ni perder posiciones.
- Cuando la app vuelve del segundo plano, no debe acumular consultas ni quedarse congelada.

### 5. Pruebas
- Pruebas unitarias (Vitest ya está configurado) para la lógica que agregues o cambies: sesión, polling, cálculos.
- Las pruebas de componentes son opcionales.

### 6. `NOTAS.md` (obligatorio)
Un archivo corto en la raíz con:
1. Cómo correr lo que hiciste, si cambió algo.
2. Las decisiones importantes que tomaste y por qué (navegación, manejo de estado, almacenamiento de tokens…).
3. **El código existente ya está en uso. Si encontraste algo en él que te preocupe, descríbelo**: qué es, qué impacto tiene y si lo corregiste o cómo lo corregirías.
4. Qué harías con más tiempo.
5. **Uso de IA:** qué herramientas usaste, para qué, y al menos un caso en que la IA se equivocó y cómo te diste cuenta. Usar IA está permitido y es normal en nuestro equipo. Lo que evaluamos es el criterio con que la usas.

**Opcional, solo si te sobra tiempo:** el cargo también incluye React web. Si quieres mostrarlo, haz una página web mínima que reutilice la lógica de `app/src/lib`. No suma si sacrificas lo anterior.

## Tiempo y entrega

- Calculamos entre **3 y 4 horas**. Por favor, no le dediques más de 4: si no alcanzas todo, prioriza y explica en `NOTAS.md` qué dejaste por fuera y por qué. Una entrega parcial bien razonada vale más que una completa sin criterio.
- Tienes **72 horas** desde que recibes la prueba.
- Entrega un repositorio Git (GitHub, GitLab o Bitbucket; si es privado, te diremos a quién darle acceso) o un `.zip` **con la carpeta `.git` incluida**. Queremos ver tus commits, así que haz commits pequeños con mensajes claros.
- Incluye un video corto (1–2 minutos, grabación de pantalla del teléfono o del emulador) mostrando la app funcionando.
- Después revisaremos tu entrega contigo en una llamada de unos 30 minutos.

Si algo del enunciado no está claro, toma una decisión razonable, anótala en `NOTAS.md` y sigue adelante. También puedes escribirnos.

¡Éxitos!
