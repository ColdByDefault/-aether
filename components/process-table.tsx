'use client';

import { useEffect, useState } from 'react';
import { Cpu } from 'lucide-react';

interface ProcessEntry {
  pid: number;
  name: string;
  cmdline: string;
  cpuPercent: number;
  memRss: number;
  memPercent: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

type SortKey = 'cpu' | 'mem';

export function ProcessTable() {
  const [procs, setProcs] = useState<ProcessEntry[]>([]);
  const [sort, setSort] = useState<SortKey>('cpu');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const poll = async () => {
      try {
        const res = await fetch('/api/processes');
        if (!res.ok) throw new Error('fetch failed');
        const data: unknown = await res.json();
        if (!active) return;
        if (Array.isArray(data)) setProcs(data as ProcessEntry[]);
        setError(null);
        setLoading(false);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : 'error');
        setLoading(false);
      }
    };

    poll();
    const interval = setInterval(poll, 15_000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  const sorted = [...procs]
    .sort((a, b) => sort === 'cpu' ? b.cpuPercent - a.cpuPercent : b.memPercent - a.memPercent)
    .slice(0, 15);

  const maxVal = sorted[0]
    ? (sort === 'cpu' ? sorted[0].cpuPercent : sorted[0].memPercent)
    : 1;

  return (
    <section id="processes" className="scroll-mt-20">
      <div className="mb-3 flex items-center gap-2 font-mono text-xs text-muted-foreground">
        <Cpu className="h-3.5 w-3.5 text-primary" />
        <span className="uppercase tracking-wider">Processes</span>
        <span className="flex-1 border-t border-border" />
        <span className="inline-flex items-center gap-1 text-muted-foreground/60">
          sort
          <button
            onClick={() => setSort('cpu')}
            className={`ml-1 px-1 py-0.5 transition-colors ${sort === 'cpu' ? 'text-primary' : 'hover:text-foreground'}`}
          >
            cpu
          </button>
          /
          <button
            onClick={() => setSort('mem')}
            className={`px-1 py-0.5 transition-colors ${sort === 'mem' ? 'text-primary' : 'hover:text-foreground'}`}
          >
            mem
          </button>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className={`term-dot h-1.5 w-1.5 ${error ? 'bg-destructive' : 'bg-primary'}`} />
          {error ? 'error' : loading ? 'polling' : 'live · 15s'}
        </span>
      </div>

      <div className="panel">
        <div className="border-b border-border px-4 py-2 font-mono text-xs text-muted-foreground/40">
          <div className="grid grid-cols-[auto_1fr_4rem_5rem_6rem_5rem] gap-3 items-center">
            <span className="w-16" />
            <span>name</span>
            <span className="text-right">pid</span>
            <span className="text-right">cpu%</span>
            <span className="text-right">rss</span>
            <span className="text-right">mem%</span>
          </div>
        </div>

        <div className="divide-y divide-border/40">
          {loading && !error && (
            <div className="px-4 py-3 font-mono text-sm text-muted-foreground">scanning processes...</div>
          )}
          {error && (
            <div className="px-4 py-3 font-mono text-sm text-destructive">ERR: {error}</div>
          )}
          {sorted.map((p) => {
            const val = sort === 'cpu' ? p.cpuPercent : p.memPercent;
            const barWidth = maxVal > 0 ? (val / maxVal) * 100 : 0;
            return (
              <div
                key={p.pid}
                className="px-4 py-2 font-mono text-xs hover:bg-muted/30 transition-colors"
              >
                <div className="grid grid-cols-[auto_1fr_4rem_5rem_6rem_5rem] items-center gap-3">
                  <div className="relative h-0.5 w-16 overflow-hidden bg-muted/60">
                    <div
                      className="h-full bg-primary/50 transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="truncate text-foreground/80" title={p.cmdline}>
                    {p.name}
                  </span>
                  <span className="text-right tabular-nums text-muted-foreground/40">{p.pid}</span>
                  <span className="text-right tabular-nums text-foreground">{p.cpuPercent.toFixed(1)}%</span>
                  <span className="text-right tabular-nums text-muted-foreground/70">{formatBytes(p.memRss)}</span>
                  <span className="text-right tabular-nums text-muted-foreground/70">{p.memPercent.toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {!loading && !error && procs.length > 0 && (
          <div className="border-t border-border px-4 py-2 font-mono text-xs text-muted-foreground/30">
            {procs.length} processes · top 15 by {sort}
          </div>
        )}
      </div>
    </section>
  );
}
