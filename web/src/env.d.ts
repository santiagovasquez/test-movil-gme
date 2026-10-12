// Solo para tsc, que revisa `app/src/config.ts`; en ejecución Vite usa `src/config.ts`.
declare const process: { env: Record<string, string | undefined> };
