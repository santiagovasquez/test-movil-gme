// Desde el teléfono, "localhost" es el teléfono: usa la IP de tu computador en la red local.
// Ejemplo: EXPO_PUBLIC_API_URL=http://192.168.1.50:4000 npx expo start
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
