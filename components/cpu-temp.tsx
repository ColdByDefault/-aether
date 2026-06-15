'use client';

import { useEffect, useState } from 'react';
import { Thermometer } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ThermalZone {
  zone: string;
  type: string;
  celsius: number;
}

interface HardwareData {
  cpuTemps: ThermalZone[];
  timestamp: string;
}

const TEMP_MAX = 100;

function tempColor(celsius: number): string {
  if (celsius >= 80) return 'text-destructive';
  if (celsius >= 60) return 'text-chart-4';
  return 'text-primary';
}

function tempBarClass(celsius: number): string {
  if (celsius >= 80) return '[&>div]:bg-destructive';
  if (celsius >= 60) return '[&>div]:bg-chart-4';
  return '';
}

export function CpuTemp() {
  const [data, setData] = useState<HardwareData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        const res = await fetch('/api/hardware');
        if (!res.ok) throw new Error('Failed to fetch hardware data');
        const json = await res.json();
        if (!active) return;
        setData(json);
        setError(null);
        setLoading(false);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const zones = data?.cpuTemps ?? [];

  return (
    <section id="cpu-temp" className="scroll-mt-20 h-full flex flex-col">
      <div className="mb-3 flex shrink-0 items-center gap-2 font-mono text-xs text-muted-foreground">
        <Thermometer className="h-3.5 w-3.5 text-primary" />
        <span className="uppercase tracking-wider">CPU Temperature</span>
        <span className="flex-1 border-t border-border" />
        <span className="inline-flex items-center gap-1.5">
          <span className={`term-dot h-1.5 w-1.5 ${error ? 'bg-destructive' : 'bg-primary'}`} />
          {error ? 'error' : loading ? 'polling' : 'live · 15s'}
        </span>
      </div>

      <div className="panel flex-1 min-h-0 overflow-hidden p-4">
        {error && (
          <p className="font-mono text-sm text-destructive">ERR: {error}</p>
        )}

        {!error && zones.length === 0 && !loading && (
          <p className="font-mono text-sm text-muted-foreground">
            no thermal zones detected
          </p>
        )}

        {loading && zones.length === 0 && (
          <p className="font-mono text-sm text-muted-foreground">reading sensors...</p>
        )}

        <div className="space-y-4">
          {zones.map((z) => (
            <div key={z.zone} className="space-y-1.5">
              <div className="flex items-center justify-between font-mono text-sm">
                <span className="text-muted-foreground">
                  {z.type !== 'unknown' ? z.type : z.zone}
                </span>
                <span className={`tabular-nums font-semibold ${tempColor(z.celsius)}`}>
                  {z.celsius.toFixed(1)}°C
                </span>
              </div>
              <Progress
                value={(z.celsius / TEMP_MAX) * 100}
                className={`h-1.5 ${tempBarClass(z.celsius)}`}
              />
              <p className="text-right font-mono text-[10px] text-muted-foreground/40">
                / {TEMP_MAX}°C
              </p>
            </div>
          ))}
        </div>

        {data && (
          <p className="mt-4 font-mono text-[10px] text-muted-foreground/30">
            sampled {new Date(data.timestamp).toISOString().slice(11, 19)}Z
          </p>
        )}
      </div>
    </section>
  );
}
