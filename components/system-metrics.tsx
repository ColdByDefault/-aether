'use client';

import { useEffect, useState } from 'react';
import { Monitor, Cpu, MemoryStick, HardDrive, Server } from 'lucide-react';
import { Sparkline } from '@/components/sparkline';

interface DiskInfo {
  total: number;
  used: number;
  available: number;
  usedPercent: number;
  mount: string;
}

interface HistoryPoint {
  ts: string;
  cpu: number;
  mem: number;
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
  history?: HistoryPoint[];
}

interface ProcessEntry {
  pid: number;
  name: string;
  cmdline: string;
  cpuPercent: number;
  memRss: number;
  memPercent: number;
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

function meterColor(percent: number): string {
  if (percent >= 90) return 'bg-destructive';
  if (percent >= 70) return 'bg-chart-4';
  return 'bg-primary';
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

function ProcessList({
  procs,
  sortBy,
  label,
}: {
  procs: ProcessEntry[];
  sortBy: 'cpu' | 'mem';
  label: string;
}) {
  const sorted = [...procs]
    .sort((a, b) => sortBy === 'cpu' ? b.cpuPercent - a.cpuPercent : b.memPercent - a.memPercent)
    .slice(0, 6);

  const maxVal = sorted[0]
    ? (sortBy === 'cpu' ? sorted[0].cpuPercent : sorted[0].memPercent)
    : 1;

  return (
    <div className="mt-4 space-y-0.5">
      <p className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground/60">
        {label}
      </p>
      {sorted.map((p) => {
        const val = sortBy === 'cpu' ? p.cpuPercent : p.memPercent;
        const barWidth = maxVal > 0 ? (val / maxVal) * 100 : 0;
        const displayName = p.name.length > 18 ? p.name.slice(0, 17) + '…' : p.name;
        const secondary = sortBy === 'cpu'
          ? formatBytes(p.memRss)
          : `${p.cpuPercent.toFixed(1)}% cpu`;
        return (
          <div key={p.pid} className="group font-mono text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="w-36 shrink-0 truncate text-muted-foreground" title={p.cmdline}>
                {displayName}
              </span>
              <div className="relative h-1 flex-1 overflow-hidden bg-muted/60">
                <div
                  className="h-full bg-primary/50 transition-all duration-500"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <span className="w-12 shrink-0 text-right tabular-nums text-foreground">
                {val.toFixed(1)}%
              </span>
              <span className="w-16 shrink-0 text-right tabular-nums text-muted-foreground/50">
                {secondary}
              </span>
            </div>
          </div>
        );
      })}
      {sorted.length === 0 && (
        <p className="font-mono text-xs text-muted-foreground/50">no data yet</p>
      )}
    </div>
  );
}

export function SystemMetrics() {
  const [data, setData] = useState<MetricsData | null>(null);
  const [procs, setProcs] = useState<ProcessEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchAll = async () => {
      try {
        const [metricsRes, procsRes] = await Promise.all([
          fetch('/api/metrics'),
          fetch('/api/processes'),
        ]);
        if (!metricsRes.ok) throw new Error('Failed to fetch metrics');
        const [metrics, processes] = await Promise.all([
          metricsRes.json(),
          procsRes.ok ? procsRes.json() : Promise.resolve([]),
        ]);
        if (!active) return;
        setData(metrics);
        if (Array.isArray(processes)) setProcs(processes);
        setError(null);
        setLoading(false);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    fetchAll();
    const interval = setInterval(fetchAll, 15_000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <section id="system" className="scroll-mt-20 h-full flex flex-col">
      <div className="mb-3 flex shrink-0 items-center gap-2 font-mono text-xs text-muted-foreground">
        <Monitor className="h-3.5 w-3.5 text-primary" />
        <span className="uppercase tracking-wider">System Overview</span>
        <span className="flex-1 border-t border-border" />
        <span className="inline-flex items-center gap-1.5">
          <span className={`term-dot ${error ? 'bg-destructive' : 'bg-primary'} h-1.5 w-1.5`} />
          {error ? 'error' : loading ? 'polling' : 'live · 15s'}
        </span>
      </div>

      <div className="panel flex-1 min-h-0 overflow-hidden">
        {error && (
          <div className="border-b border-border px-4 py-2.5 font-mono text-sm text-destructive">
            ERR: {error}
          </div>
        )}

        <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
          {/* CPU */}
          <div className="p-4">
            <p className="mb-3 flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              <Cpu className="h-3.5 w-3.5 text-primary" />cpu
            </p>
            {data ? (
              <div className="space-y-3">
                <Meter
                  label="usage"
                  percent={data.cpu.usedPercent}
                  detail={`${data.cpu.cores} cores · load ${data.cpu.loadAvg.map((n) => n.toFixed(2)).join(' ')}`}
                />
                <div className="h-10">
                  {(data.history?.length ?? 0) > 1 && (
                    <>
                      <Sparkline
                        data={data.history!.map((h) => h.cpu)}
                        pct={data.cpu.usedPercent}
                        height={28}
                      />
                      <p className="mt-0.5 text-right font-mono text-[10px] text-muted-foreground/30">5m</p>
                    </>
                  )}
                </div>
                <p className="truncate font-mono text-xs text-muted-foreground/70" title={data.cpu.model}>
                  {data.cpu.model}
                </p>
                {procs.length > 0 && (
                  <ProcessList procs={procs} sortBy="cpu" label="top by cpu" />
                )}
              </div>
            ) : (
              <p className="font-mono text-sm text-muted-foreground">reading core...</p>
            )}
          </div>

          {/* Memory */}
          <div className="p-4">
            <p className="mb-3 flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              <MemoryStick className="h-3.5 w-3.5 text-primary" />memory
            </p>
            {data ? (
              <div className="space-y-3">
                <Meter
                  label="ram"
                  percent={data.memory.usedPercent}
                  detail={`${formatBytes(data.memory.used)} / ${formatBytes(data.memory.total)} · ${formatBytes(data.memory.free)} free`}
                />
                <div className="h-10">
                  {(data.history?.length ?? 0) > 1 && (
                    <>
                      <Sparkline
                        data={data.history!.map((h) => h.mem)}
                        pct={data.memory.usedPercent}
                        height={28}
                      />
                      <p className="mt-0.5 text-right font-mono text-[10px] text-muted-foreground/30">5m</p>
                    </>
                  )}
                </div>
                {procs.length > 0 && (
                  <ProcessList procs={procs} sortBy="mem" label="top by memory" />
                )}
              </div>
            ) : (
              <p className="font-mono text-sm text-muted-foreground">reading memory...</p>
            )}
          </div>
        </div>

        {/* Storage */}
        <div className="border-t border-border p-4">
          <p className="mb-3 flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            <HardDrive className="h-3.5 w-3.5 text-primary" />storage
          </p>
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
          <p className="mb-3 flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            <Server className="h-3.5 w-3.5 text-primary" />host
          </p>
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
