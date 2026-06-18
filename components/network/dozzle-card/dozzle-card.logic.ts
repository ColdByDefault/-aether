import { useCallback, useEffect, useState } from 'react';

export const DOZZLE_URL = 'http://192.168.2.100:3002/';

export interface DozzleStatus {
  found: boolean;
  running: boolean;
  id?: string;
  name?: string;
}

export function useDozzleCard() {
  const [status, setStatus] = useState<DozzleStatus | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/dozzle');
      setStatus((await res.json()) as DozzleStatus);
    } catch {
      setStatus({ found: false, running: false });
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15_000);
    return () => clearInterval(id);
  }, [refresh]);

  const toggle = useCallback(async () => {
    if (!status) return;
    const action = status.running ? 'stop' : 'start';
    setPending(true);
    setError(null);
    try {
      const res = await fetch('/api/dozzle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as DozzleStatus & { error?: string };
      if (!res.ok) {
        setError(data.error ?? `Failed to ${action}`);
      } else {
        setStatus(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setPending(false);
    }
  }, [status]);

  return { status, pending, error, toggle, refresh };
}
