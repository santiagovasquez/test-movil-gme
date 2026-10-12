import { useEffect, useState } from 'react';

/** `Date.now()` que se actualiza cada `intervalMs` (por defecto 1 s). */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
