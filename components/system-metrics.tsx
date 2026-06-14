'use client';

import { useEffect, useState } from 'react';

interface DiskInfo {
  total: number;
  used: number;
  available: number;
  usedPercent: number;
  mount: string;
}

interface MetricsData {
  cpu: {
    usedPercent: number;
    cores: number;
    model: string;
    loadAvg: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usedPercent: number;
  };
  disk: DiskInfo[];
  uptime: number;
  hostname: string;
  platform: string;
  timestamp: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${mins}m`);
  return parts.join(' ');
}

// ASCII-style severity color for the meter fill.
function meterColor(percent: number): string {
  if (percent >= 90) return 'bg-destructive';
  if (percent >= 70) return 'bg-chart-4';
  return 'bg-primary';
}

// Render a monospace bar: [||||||||----------]
function asciiBar(percent: number, width = 24): string {
  const filled = Math.round((Math.min(100, Math.max(0, percent)) / 100) * width);
  return '[' + '|'.repeat(filled) + '-'.repeat(width - filled) + ']';
}

function Meter({ label, percent, detail }: { label: string; percent: number; detail: string }) {
  return (
    <div className="font-mono text-sm">
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground tabular-nums">{percent.toFixed(1)}%</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden bg-muted">
        <div
          className={`h-full transition-all duration-500 ${meterColor(percent)}`}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground/70">{detail}</p>
    </div>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline gap-3 font-mono text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className="flex-1 border-b border-dashed border-border/60" />
      <span className={accent ? 'accent-text' : 'text-foreground'}>{v}</span>
    </div>
  );
}

export function SystemMetrics() {
  const [data, setData] = useState<MetricsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/metrics');
        if (!res.ok) throw new Error('Failed to fetch metrics');
        const result = await res.json();
        if (!active) return;
        setData(result);
        setError(null);
        setLoading(false);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <section id="system" className="scroll-mt-20">
      <div className="mb-3 flex items-center gap-2 font-mono text-xs text-muted-foreground">
        <span className="accent-text">##</span>
        <span className="uppercase tracking-wider">System Overview</span>
        <span className="flex-1 border-t border-border" />
        <span className="inline-flex items-center gap-1.5">
          <span className={`term-dot ${error ? 'bg-destructive' : 'bg-primary'} h-1.5 w-1.5`} />
          {error ? 'error' : loading ? 'polling' : 'live · 3s'}
        </span>
      </div>

      <div className="panel">
        {error && (
          <div className="border-b border-border px-4 py-2.5 font-mono text-sm text-destructive">
            ERR: {error}
          </div>
        )}

        <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
          {/* CPU */}
          <div className="p-4">
            <p className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">cpu</p>
            {data ? (
              <div className="space-y-3">
                <Meter
                  label="usage"
                  percent={data.cpu.usedPercent}
                  detail={`${data.cpu.cores} cores · load ${data.cpu.loadAvg.map((n) => n.toFixed(2)).join(' ')}`}
                />
                <p className="truncate font-mono text-xs text-muted-foreground/70" title={data.cpu.model}>
                  {data.cpu.model}
                </p>
              </div>
            ) : (
              <p className="font-mono text-sm text-muted-foreground">reading core...</p>
            )}
          </div>

          {/* Memory */}
          <div className="p-4">
            <p className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">memory</p>
            {data ? (
              <div className="space-y-3">
                <Meter
                  label="ram"
                  percent={data.memory.usedPercent}
                  detail={`${formatBytes(data.memory.used)} / ${formatBytes(data.memory.total)} · ${formatBytes(data.memory.free)} free`}
                />
              </div>
            ) : (
              <p className="font-mono text-sm text-muted-foreground">reading memory...</p>
            )}
          </div>
        </div>

        {/* Storage */}
        <div className="border-t border-border p-4">
          <p className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">storage</p>
          {data && data.disk.length > 0 ? (
            <div className="grid grid-cols-1 gap-x-8 gap-y-4 lg:grid-cols-2">
              {data.disk.map((d) => (
                <Meter
                  key={d.mount}
                  label={d.mount}
                  percent={d.usedPercent}
                  detail={`${formatBytes(d.used)} / ${formatBytes(d.total)} · ${formatBytes(d.available)} free`}
                />
              ))}
            </div>
          ) : (
            <p className="font-mono text-sm text-muted-foreground">
              {loading ? 'reading volumes...' : 'no storage data'}
            </p>
          )}
        </div>

        {/* Host info */}
        <div className="border-t border-border p-4">
          <p className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">host</p>
          {data ? (
            <div className="grid grid-cols-1 gap-x-12 gap-y-2 sm:grid-cols-2">
              <Row k="hostname" v={data.hostname} />
              <Row k="platform" v={data.platform} />
              <Row k="uptime" v={formatUptime(data.uptime)} accent />
              <Row k="cores" v={String(data.cpu.cores)} />
            </div>
          ) : (
            <p className="font-mono text-sm text-muted-foreground">reading host...</p>
          )}
        </div>
      </div>
    </section>
  );
}
