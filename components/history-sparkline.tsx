'use client';

import { useEffect, useState } from 'react';
import { Sparkline } from '@/components/sparkline';

interface HistoryBucket {
  ts: string;
  cpuPct: number | null;
  memPct: number | null;
  swapPct: number | null;
  tempC: number | null;
  powerW: number | null;
  batteryPct: number | null;
}

export type HistoryMetric = keyof Omit<HistoryBucket, 'ts'>;

interface HistorySparklineProps {
  metric: HistoryMetric;
  /** Current value used for color thresholding (0–100 scale). */
  pct?: number;
  /** If set, raw values are scaled: normalized = (value / maxVal) * 100. */
  maxVal?: number;
  height?: number;
  className?: string;
}

export function HistorySparkline({
  metric,
  pct = 0,
  maxVal,
  height = 32,
  className = '',
}: HistorySparklineProps) {
  const [points, setPoints] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/metrics/history');
        if (!res.ok) return;
        const json: { buckets: HistoryBucket[] } = await res.json();
        if (cancelled) return;

        const raw = json.buckets
          .map((b) => b[metric])
          .filter((v): v is number => v != null);

        if (raw.length < 2) {
          setPoints([]);
          return;
        }

        // Determine scale ceiling: explicit maxVal, or auto-detect if values exceed 100.
        const dataMax = Math.max(...raw);
        const scale = maxVal ?? (dataMax > 100 ? dataMax : 100);
        const normalized = raw.map((v) => Math.min(100, Math.max(0, (v / scale) * 100)));
        setPoints(normalized);
      } catch {
        // silently ignore — history is non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [metric, maxVal]);

  if (loading || points.length < 2) {
    return (
      <div style={{ height }} className={`flex items-center ${className}`}>
        <span className="font-mono text-[10px] text-muted-foreground/30">
          {loading ? 'loading history…' : 'collecting…'}
        </span>
      </div>
    );
  }

  return (
    <div className={className}>
      <Sparkline data={points} pct={pct} height={height} />
      <div className="flex justify-between font-mono text-[10px] text-muted-foreground/30 mt-0.5">
        <span>−24h</span>
        <span>now</span>
      </div>
    </div>
  );
}
