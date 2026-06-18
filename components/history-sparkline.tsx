"use client";

import { useEffect, useState } from "react";
import { AreaChart } from "@/components/tremor/AreaChart";

interface HistoryBucket {
  ts: string;
  cpuPct: number | null;
  memPct: number | null;
  swapPct: number | null;
  tempC: number | null;
  powerW: number | null;
  batteryPct: number | null;
}

export type HistoryMetric = keyof Omit<HistoryBucket, "ts">;

interface HistorySparklineProps {
  metric: HistoryMetric;
  /** Used for scale ceiling when values exceed 100 (e.g. tempC, powerW). */
  maxVal?: number;
  height?: number;
  className?: string;
  /** Label shown on the Y-axis tooltip (e.g. "°C", "W", "%"). */
  unit?: string;
}

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function HistorySparkline({
  metric,
  maxVal,
  height = 80,
  className = "",
  unit = "%",
}: HistorySparklineProps) {
  const [data, setData] = useState<{ time: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/metrics/history");
        if (!res.ok) return;
        const json: { buckets: HistoryBucket[] } = await res.json();
        if (cancelled) return;

        const raw = json.buckets
          .filter((b) => b[metric] != null)
          .map((b) => ({ ts: b.ts, val: b[metric] as number }));

        if (raw.length < 2) {
          setData([]);
          return;
        }

        const dataMax = Math.max(...raw.map((r) => r.val));
        const scale = maxVal ?? (dataMax > 100 ? dataMax : null);

        setData(
          raw.map((r) => ({
            time: r.ts,
            value: scale
              ? parseFloat(((r.val / scale) * 100).toFixed(1))
              : parseFloat(r.val.toFixed(1)),
          })),
        );
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

  if (loading) {
    return (
      <div style={{ height }} className={`flex items-center ${className}`}>
        <span className="font-mono text-[10px] text-muted-foreground/30">
          loading history…
        </span>
      </div>
    );
  }

  if (data.length < 2) {
    return (
      <div style={{ height }} className={`flex items-center ${className}`}>
        <span className="font-mono text-[10px] text-muted-foreground/30">
          collecting…
        </span>
      </div>
    );
  }

  return (
    <div className={className} style={{ height }}>
      <AreaChart
        data={data}
        index="time"
        xAxisFormatter={(v) => formatTime(String(v))}
        categories={["value"]}
        valueFormatter={(v) => `${v}${unit}`}
        showLegend={false}
        showYAxis={false}
        showGridLines={false}
        showXAxis
        startEndOnly
        className="h-full w-full"
        colors={["blue"]}
      />
    </div>
  );
}
