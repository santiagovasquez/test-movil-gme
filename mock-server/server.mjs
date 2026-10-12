// Servidor simulado de la plataforma de flota. Sin dependencias: `node server.mjs`.
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';

const PORT = Number(process.env.PORT ?? 4000);
const ACCESS_TTL_S = 60;
const REFRESH_TTL_S = 24 * 60 * 60;
const TICK_MS = 2000;

const USERS = [{ email: 'supervisor@gme.co', password: 'flota2026', name: 'Mariana Ospina' }];

const VEHICLES = [
  { id: 'veh-01', label: 'Camión 01', plate: 'TSM-482', driver: 'Carlos Henao' },
  { id: 'veh-02', label: 'Camión 02', plate: 'WGK-115', driver: 'Diana Zapata' },
  { id: 'veh-03', label: 'Furgón 03', plate: 'JNR-903', driver: 'Felipe Arango' },
  { id: 'veh-04', label: 'Furgón 04', plate: 'KLM-227', driver: 'Natalia Pérez' },
  { id: 'veh-05', label: 'Camión 05', plate: 'HTV-640', driver: 'Jorge Cardona' },
  { id: 'veh-06', label: 'Furgón 06', plate: 'QPB-318', driver: 'Luisa Montoya' },
  { id: 'veh-07', label: 'Camión 07', plate: 'SXD-751', driver: 'Mateo Vélez' },
  { id: 'veh-08', label: 'Furgón 08', plate: 'BYE-064', driver: 'Sara Londoño' },
];

const accessTokens = new Map(); // token -> { email, expiresAt }
const refreshTokens = new Map(); // token -> { email, expiresAt }

// --- Simulación de movimiento -------------------------------------------------

const MEDELLIN = { lat: 6.2442, lng: -75.5812 };
const state = new Map(
  VEHICLES.map((v, i) => [
    v.id,
    {
      lat: MEDELLIN.lat + (i - 4) * 0.012,
      lng: MEDELLIN.lng + ((i * 7) % 5 - 2) * 0.01,
      heading: (i * 45) % 360,
      speedKmh: 20 + i * 5,
    },
  ]),
);

const positionLog = []; // en orden de llegada al servidor
const delayed = []; // { releaseAtTick, update }
let tick = 0;

function nextPosition(vehicleId, at) {
  const s = state.get(vehicleId);
  s.heading = (s.heading + (Math.random() * 40 - 20) + 360) % 360;
  s.speedKmh = Math.max(0, Math.min(95, s.speedKmh + (Math.random() * 16 - 8)));
  const meters = (s.speedKmh / 3.6) * (TICK_MS / 1000);
  const rad = (s.heading * Math.PI) / 180;
  s.lat += (meters * Math.cos(rad)) / 111_320;
  s.lng += (meters * Math.sin(rad)) / (111_320 * Math.cos((s.lat * Math.PI) / 180));
  return {
    vehicleId,
    lat: Number(s.lat.toFixed(6)),
    lng: Number(s.lng.toFixed(6)),
    speedKmh: Math.round(s.speedKmh),
    heading: Math.round(s.heading),
    recordedAt: new Date(at).toISOString(),
  };
}

function simulate(at = Date.now()) {
  tick += 1;
  for (const v of VEHICLES) {
    const update = nextPosition(v.id, at);
    const roll = Math.random();
    if (roll < 0.15) {
      // Sin señal: el dispositivo guarda la posición y la reenvía más tarde.
      delayed.push({ releaseAtTick: tick + 2 + Math.floor(Math.random() * 3), update });
    } else {
      positionLog.push(update);
      if (roll > 0.95) positionLog.push({ ...update }); // reenvío duplicado
    }
  }
  for (let i = delayed.length - 1; i >= 0; i -= 1) {
    if (delayed[i].releaseAtTick <= tick) {
      positionLog.push(delayed[i].update);
      delayed.splice(i, 1);
    }
  }
  if (Math.random() < 0.12) createAlert();
}

// --- Alertas ------------------------------------------------------------------

const ALERT_TYPES = [
  ['overspeed', (s) => `Exceso de velocidad: ${s} km/h en zona de 60 km/h`],
  ['harsh_braking', () => 'Frenado brusco detectado'],
  ['geofence_exit', () => 'Salió de la geocerca "Zona Franca Rionegro"'],
  ['low_battery', () => 'Batería del dispositivo al 12 %'],
];
const alerts = [];
let alertSeq = 0;

function createAlert(vehicleId) {
  const v = vehicleId ?? VEHICLES[Math.floor(Math.random() * VEHICLES.length)].id;
  const [type, message] = ALERT_TYPES[Math.floor(Math.random() * ALERT_TYPES.length)];
  alertSeq += 1;
  alerts.push({
    id: `al-${String(alertSeq).padStart(4, '0')}`,
    vehicleId: v,
    type,
    message: message(Math.max(68, Math.round(state.get(v).speedKmh + 20))),
    createdAt: new Date().toISOString(),
    read: false,
  });
}

for (let i = 0; i < 10; i += 1) createAlert(VEHICLES[i % VEHICLES.length].id);
for (let i = 5; i > 0; i -= 1) simulate(Date.now() - i * TICK_MS);
setInterval(() => simulate(), TICK_MS);

// --- HTTP ---------------------------------------------------------------------

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  res.end(body === undefined ? '' : JSON.stringify(body));
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return null;
  }
}

function issueTokens(email) {
  const accessToken = randomBytes(16).toString('hex');
  const refreshToken = randomBytes(24).toString('hex');
  const now = Date.now();
  accessTokens.set(accessToken, { email, expiresAt: now + ACCESS_TTL_S * 1000 });
  refreshTokens.set(refreshToken, { email, expiresAt: now + REFRESH_TTL_S * 1000 });
  return { accessToken, refreshToken, expiresIn: ACCESS_TTL_S };
}

function authenticate(req) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const session = accessTokens.get(token);
  if (!session || session.expiresAt < Date.now()) return null;
  return session;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const started = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${path}${url.search} -> ${res.statusCode} (${Date.now() - started} ms)`);
  });

  if (req.method === 'OPTIONS') return send(res, 204);

  if (req.method === 'POST' && path === '/auth/login') {
    const body = await readJson(req);
    const user = USERS.find((u) => u.email === body?.email && u.password === body?.password);
    if (!user) return send(res, 401, { error: 'invalid_credentials', message: 'Correo o contraseña incorrectos' });
    return send(res, 200, { ...issueTokens(user.email), user: { name: user.name, email: user.email } });
  }

  if (req.method === 'POST' && path === '/auth/refresh') {
    const body = await readJson(req);
    const session = refreshTokens.get(body?.refreshToken);
    if (!session || session.expiresAt < Date.now()) {
      return send(res, 401, { error: 'invalid_refresh_token', message: 'La sesión expiró' });
    }
    refreshTokens.delete(body.refreshToken); // de un solo uso
    return send(res, 200, issueTokens(session.email));
  }

  const session = authenticate(req);
  if (!session) return send(res, 401, { error: 'unauthorized', message: 'Token ausente, inválido o expirado' });

  if (req.method === 'GET' && path === '/vehicles') {
    return send(res, 200, { items: VEHICLES });
  }

  if (req.method === 'GET' && path === '/positions') {
    if (Math.random() < 0.05) return send(res, 503, { error: 'unavailable', message: 'Intenta de nuevo' });
    const since = Number(url.searchParams.get('since') ?? 0);
    if (!Number.isInteger(since) || since < 0) return send(res, 400, { error: 'bad_request', message: '`since` inválido' });
    const updates = positionLog.slice(since, since + 200);
    return send(res, 200, { cursor: since + updates.length, updates });
  }

  if (req.method === 'GET' && path === '/alerts') {
    const vehicleId = url.searchParams.get('vehicleId');
    const items = alerts
      .filter((a) => !vehicleId || a.vehicleId === vehicleId)
      .slice()
      .reverse();
    return send(res, 200, { items });
  }

  const readMatch = path.match(/^\/alerts\/([\w-]+)\/read$/);
  if (req.method === 'POST' && readMatch) {
    const alert = alerts.find((a) => a.id === readMatch[1]);
    if (!alert) return send(res, 404, { error: 'not_found', message: 'La alerta no existe' });
    alert.read = true;
    return send(res, 200, alert);
  }

  return send(res, 404, { error: 'not_found', message: 'Ruta no encontrada' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor simulado en http://0.0.0.0:${PORT}`);
  console.log('Usuario: supervisor@gme.co / flota2026');
});
