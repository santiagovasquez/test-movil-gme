import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const local = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// La lógica se importa sin copiar desde la app (`@app/lib` → `../app/src/lib`).
// `app/src/config.ts` lee `process.env` (Expo); en la web, el `../config` que
// importa `lib/http.ts` se resuelve a `src/config.ts`, sin tocar la app.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^\.\.\/config$/, replacement: local('src/config.ts') },
      { find: '@app', replacement: local('../app/src') },
    ],
  },
  server: { port: 5173, fs: { allow: ['..'] } },
});
