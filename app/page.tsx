'use client';

import { useEffect, useState } from 'react';
import { SystemMetrics } from '@/components/system-metrics';
import { EventFeed } from '@/components/event-feed';
import { ThemeToggle } from '@/components/theme-toggle';

interface ServiceStatus {
  name: string;
  running: boolean;
  error?: string;
}

interface CronJob {
  id: string;
  name: string;
  enabled: boolean;
  state: string;
  schedule: string;
  nextRun: string | null;
  lastStatus: string | null;
  lastError: string | null;
}

interface DashboardData {
  ip: string;
  timestamp: string;
  services: ServiceStatus[];
  cronJobs: CronJob[];
}

const NAV = [
  { id: 'system', label: 'System' },
  { id: 'events', label: 'Events' },
];


export default function Page() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [time, setTime] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/status');
      if (!response.ok) throw new Error('Failed to fetch status');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const updateTime = () => {
    setTime(new Date().toISOString().replace('T', ' ').slice(0, 19) + 'Z');
  };

  useEffect(() => {
    fetchStatus();
    updateTime();
    const statusInterval = setInterval(fetchStatus, 30_000);
    const timeInterval = setInterval(updateTime, 1000);
    return () => {
      clearInterval(statusInterval);
      clearInterval(timeInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 font-mono text-sm">
            <span className="accent-text">▮</span>
            <span className="font-semibold text-foreground">aether</span>
            <span className="text-muted-foreground">/ daemon</span>
          </div>
          <nav className="hidden items-center gap-5 font-mono text-xs text-muted-foreground sm:flex">
            {NAV.map((n) => (
              <a key={n.id} href={`#${n.id}`} className="transition-colors hover:text-foreground">
                {n.label}
              </a>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        {/* Hero */}
        <section className="mb-14">
          <div className="mb-5">
            <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              aether <span className="text-muted-foreground">— system monitoring daemon</span>
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className="inline-flex items-center gap-1.5 border border-border bg-muted/40 px-2 py-1 text-muted-foreground">
                <span className={`term-dot h-1.5 w-1.5 ${error ? 'bg-destructive' : 'bg-green-500'}`} />
                {error ? 'offline' : 'online'}
              </span>
            </div>
          </div>
        </section>

        {/* System Overview */}
        <div className="mb-14">
          <SystemMetrics />

          {/* Services sub-block */}
          <div className="mt-4 panel">
            <div className="panel-header">
              <span className="accent-text font-mono text-xs">##</span>
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Service Probe
              </span>
              <span className="flex-1 border-t border-border" />
              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                {data?.ip ? `ip ${data.ip}` : '—'}
              </span>
            </div>
            <div className="divide-y divide-border">
              {!data && !error && (
                <div className="px-4 py-3 font-mono text-sm text-muted-foreground">probing services...</div>
              )}
              {error && (
                <div className="px-4 py-3 font-mono text-sm text-destructive">ERR: {error}</div>
              )}
              {data?.services?.map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between px-4 py-3 font-mono text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`term-dot h-2 w-2 ${service.running ? 'bg-primary' : 'bg-destructive'}`}
                    />
                    <span className="text-foreground">{service.name.toLowerCase().replace(/\s+/g, '-')}</span>
                  </div>
                  <span className={service.running ? 'accent-text' : 'text-destructive'}>
                    {service.running ? 'up' : 'down'}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-border px-4 py-2 font-mono text-xs text-muted-foreground/70">
              last sync: {data ? new Date(data.timestamp).toISOString().slice(11, 19) + 'Z' : '—'} · clock: {time || '—'}
            </div>
          </div>

          {/* Hermes Cron Jobs */}
          {data?.cronJobs && data.cronJobs.length > 0 && (
            <div className="mt-4 panel">
              <div className="panel-header">
                <span className="accent-text font-mono text-xs">##</span>
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Hermes Cron
                </span>
                <span className="flex-1 border-t border-border" />
              </div>
              <div className="divide-y divide-border">
                {data.cronJobs.map((job) => {
                  const ok = job.enabled && job.state !== 'failed';
                  const nextLabel = job.nextRun
                    ? new Date(job.nextRun).toISOString().slice(5, 16).replace('T', ' ')
                    : job.schedule;
                  return (
                    <div
                      key={job.id}
                      className="flex items-center justify-between px-4 py-3 font-mono text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`term-dot h-2 w-2 ${ok ? 'bg-primary' : 'bg-destructive'}`} />
                        <span className="text-foreground">
                          {job.name.toLowerCase().replace(/\s+/g, '-')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground/70">
                          next {nextLabel}
                        </span>
                        <span className={ok ? 'accent-text' : 'text-destructive'}>
                          {ok ? job.state : (job.lastError ? 'err' : 'disabled')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Event Feed */}
        <div className="mb-14">
          <EventFeed />
        </div>

        {/* Footer */}
        <footer className="border-t border-border pt-6">
          <div className="flex flex-col gap-2 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>aether-daemon</span>
            <span className="text-muted-foreground/60">
              {data ? `host ${data.ip}` : 'host —'} · {time || '—'}
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
