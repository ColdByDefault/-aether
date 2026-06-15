'use client';

import { useEffect, useState } from 'react';
import { Monitor, Zap, Activity, Bot, Server, Network, ArrowLeftRight, Clock, Globe } from 'lucide-react';
import { SystemMetrics } from '@/components/system-metrics';
import { PowerMetrics } from '@/components/power-metrics';
import { EventFeed } from '@/components/event-feed';
import { AiAnalysis } from '@/components/ai-analysis';
import { ThemeToggle } from '@/components/theme-toggle';
import VersionDisplay from "@/components/VersionDisplay";


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
  lastRunAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
  model: string | null;
  provider: string | null;
  script: string | null;
  noAgent: boolean;
}

interface OpenPort {
  protocol: string;
  port: number;
  address: string;
  process: string;
}

interface TcpConnection {
  local: string;
  remote: string;
  process: string;
}

interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  ports: string;
}

interface DashboardData {
  ip: string;
  timestamp: string;
  services: ServiceStatus[];
  cronJobs: CronJob[];
  openPorts: OpenPort[];
  tcpConnections: TcpConnection[];
  dockerContainers: DockerContainer[];
}

const NAV = [
  { id: 'system', label: 'System', Icon: Monitor  },
  { id: 'power',  label: 'Power',  Icon: Zap      },
  { id: 'events', label: 'Events', Icon: Activity },
  { id: 'ai',     label: 'AI',     Icon: Bot      },
];

function PanelHeader({ icon: Icon, label, right }: {
  icon: React.ElementType;
  label: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="panel-header">
      <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
      <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="flex-1 border-t border-border" />
      {right && <span className="shrink-0 font-mono text-xs text-muted-foreground">{right}</span>}
    </div>
  );
}

export default function Page() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [time, setTime] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/status');
      if (!response.ok) throw new Error('Failed to fetch status');
      setData(await response.json());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  useEffect(() => {
    fetchStatus();
    setTime(new Date().toISOString().replace('T', ' ').slice(0, 19) + 'Z');
    const si = setInterval(fetchStatus, 30_000);
    const ti = setInterval(
      () => setTime(new Date().toISOString().replace('T', ' ').slice(0, 19) + 'Z'),
      1000,
    );
    return () => { clearInterval(si); clearInterval(ti); };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center gap-2 font-mono text-sm">
            <span className="accent-text">▮</span>
            <span className="font-semibold text-foreground">aether</span>
            <span className="text-muted-foreground">/ daemon</span>
          </div>
          <nav className="hidden items-center gap-5 font-mono text-xs text-muted-foreground sm:flex">
            {NAV.map(({ id, label, Icon }) => (
              <a key={id} href={`#${id}`} className="flex items-center gap-1.5 transition-colors hover:text-foreground">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </a>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </header>

      {/* ── Main grid ── */}
      <main className="flex-1 px-4 py-4 lg:px-6 lg:py-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

          {/* ── ROW 1: Hero (4 cols) ── */}
          <section className="relative overflow-hidden border border-border bg-card md:col-span-2 xl:col-span-4">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: "url('/background.png')", opacity: 0.12 }}
            />
            <div className="relative z-10 px-6 py-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-mono text-xl font-bold tracking-tight text-foreground md:text-2xl">
                  aether <span className="text-muted-foreground font-normal">— system monitoring daemon</span>
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-xs">
                  <span className="inline-flex items-center gap-1.5 border border-border bg-muted/40 px-2 py-1 text-muted-foreground">
                    <span className={`term-dot h-1.5 w-1.5 ${error ? 'bg-destructive' : 'bg-green-500'}`} />
                    {error ? 'offline' : 'online'}
                  </span>
                  {data?.ip && (
                    <span className="inline-flex items-center gap-1.5 border border-border bg-muted/40 px-2 py-1 text-muted-foreground">
                      <Globe className="h-3 w-3" />
                      {data.ip}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 border border-border bg-muted/40 px-2 py-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {time || '—'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ── ROW 2 ── */}

          {/* System Metrics (2 cols) */}
          <div className="md:col-span-2 xl:col-span-2">
            <SystemMetrics />
          </div>

          {/* Service Probe (1 col) */}
          <div className="xl:col-span-1">
            <div className="panel flex h-full flex-col">
              <PanelHeader
                icon={Server}
                label="Service Probe"
                right={data?.ip ? `ip ${data.ip}` : undefined}
              />
              <div className="flex-1 divide-y divide-border overflow-auto">
                {!data && !error && (
                  <div className="px-4 py-3 font-mono text-sm text-muted-foreground">probing...</div>
                )}
                {error && (
                  <div className="px-4 py-3 font-mono text-sm text-destructive">ERR: {error}</div>
                )}
                {data?.services?.map((service) => (
                  <div key={service.name}>
                    <div className="flex items-center justify-between px-4 py-3 font-mono text-sm">
                      <div className="flex items-center gap-3">
                        <span className={`term-dot h-2 w-2 ${service.running ? 'bg-primary' : 'bg-destructive'}`} />
                        <span className="text-foreground">{service.name.toLowerCase().replace(/\s+/g, '-')}</span>
                      </div>
                      <span className={service.running ? 'accent-text' : 'text-destructive'}>
                        {service.running ? 'up' : 'down'}
                      </span>
                    </div>
                    {service.name === 'Docker' && service.running && (data?.dockerContainers?.length ?? 0) > 0 && (
                      <div className="border-t border-border/50 bg-muted/20">
                        {data!.dockerContainers.map((c, i) => {
                          const isLast = i === data!.dockerContainers.length - 1;
                          const hostPorts = c.ports
                            ? [...c.ports.matchAll(/(?:0\.0\.0\.0|::):(\d+)->/g)].map((m) => ':' + m[1]).join(' ')
                            : '';
                          const running = c.status.toLowerCase().startsWith('up');
                          return (
                            <div key={c.id} className="flex items-center gap-3 py-2 pl-10 pr-4 font-mono text-xs text-muted-foreground">
                              <span className="shrink-0 text-muted-foreground/40">{isLast ? '└─' : '├─'}</span>
                              <span className={`term-dot h-1.5 w-1.5 shrink-0 ${running ? 'bg-primary' : 'bg-muted-foreground/50'}`} />
                              <span className="min-w-0 flex-1 truncate text-foreground/80">{c.name}</span>
                              {hostPorts && <span className="shrink-0 text-muted-foreground/60">{hostPorts}</span>}
                              <span className={`shrink-0 ${running ? 'accent-text' : 'text-muted-foreground/50'}`}>
                                {c.status.replace(/^Up\s+/i, '').split(' ').slice(0, 2).join(' ')}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="border-t border-border px-4 py-2 font-mono text-xs text-muted-foreground/60">
                sync {data ? new Date(data.timestamp).toISOString().slice(11, 19) + 'Z' : '—'}
              </div>
            </div>
          </div>

          {/* Col 4: Power + Network stacked, spans rows 2–3 at xl */}
          <div className="xl:col-span-1 xl:row-span-2 flex flex-col gap-4">
            <PowerMetrics />

            {/* Open Ports */}
            {(data?.openPorts?.length ?? 0) > 0 && (
              <div className="panel">
                <PanelHeader icon={Network} label="Open Ports" right={`${data!.openPorts.length} listening`} />
                <div className="divide-y divide-border">
                  {data!.openPorts.map((p) => (
                    <div key={`${p.protocol}-${p.port}-${p.address}`} className="flex items-center gap-3 px-4 py-2 font-mono text-xs">
                      <span className="w-8 shrink-0 uppercase text-muted-foreground/60">{p.protocol}</span>
                      <span className="w-12 shrink-0 text-right font-semibold text-foreground">{p.port}</span>
                      <span className="min-w-0 flex-1 truncate text-muted-foreground/70">{p.address}</span>
                      <span className="shrink-0 text-muted-foreground/50">{p.process}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TCP Connections */}
            {(data?.tcpConnections?.length ?? 0) > 0 && (
              <div className="panel">
                <PanelHeader icon={ArrowLeftRight} label="TCP" right={`${data!.tcpConnections.length} established`} />
                <div className="divide-y divide-border">
                  {data!.tcpConnections.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 px-4 py-2 font-mono text-xs">
                      <span className="min-w-0 flex-1 truncate text-foreground/80">{c.local}</span>
                      <span className="shrink-0 text-muted-foreground/40">→</span>
                      <span className="min-w-0 flex-1 truncate text-muted-foreground/70">{c.remote}</span>
                      <span className="shrink-0 text-muted-foreground/50">{c.process}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hermes Cron */}
            {(data?.cronJobs?.length ?? 0) > 0 && (
              <div className="panel">
                <PanelHeader
                  icon={Clock}
                  label="Hermes Cron"
                  right={`${data!.cronJobs.filter(j => j.enabled).length}/${data!.cronJobs.length} active`}
                />
                <div className="divide-y divide-border">
                  {data!.cronJobs.map((job) => {
                    const failed = job.enabled && job.state === 'failed';
                    const ok = job.enabled && !failed;
                    const nextLabel = job.nextRun
                      ? new Date(job.nextRun).toISOString().slice(5, 16).replace('T', ' ')
                      : null;
                    const statusLabel = !job.enabled ? 'disabled' : failed ? 'err' : job.state;
                    return (
                      <div key={job.id} className="px-4 py-3 font-mono text-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`term-dot h-2 w-2 shrink-0 ${ok ? 'bg-primary' : failed ? 'bg-destructive' : 'bg-muted-foreground/40'}`} />
                            <span className="text-foreground">{job.name.toLowerCase().replace(/\s+/g, '-')}</span>
                          </div>
                          <span className={ok ? 'accent-text' : failed ? 'text-destructive' : 'text-muted-foreground/50'}>
                            {statusLabel}
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 pl-5 text-xs text-muted-foreground/60">
                          {job.schedule && <span>{job.schedule}</span>}
                          {nextLabel && <span>next {nextLabel}</span>}
                          {job.lastStatus && (
                            <span>
                              last{' '}
                              <span className={job.lastStatus === 'success' ? 'accent-text' : 'text-destructive'}>
                                {job.lastStatus}
                              </span>
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 pl-5 text-xs text-muted-foreground/45">
                          {job.noAgent && (
                            <span className="border border-muted-foreground/25 px-1 text-muted-foreground/50">no-agent</span>
                          )}
                          {job.script && <span>script: {job.script}</span>}
                          {job.model && (
                            <span className={job.noAgent ? 'line-through opacity-40' : ''}>
                              model: {job.model}{job.provider ? ` (${job.provider})` : ''}
                            </span>
                          )}
                        </div>
                        {job.lastError && (
                          <div className="mt-1 truncate pl-5 text-xs text-destructive/80">
                            {job.lastError}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── ROW 3 ── */}

          {/* Events (2 cols) */}
          <div className="md:col-span-2 xl:col-span-2">
            <EventFeed />
          </div>

          {/* AI Analysis (1 col) */}
          <div className="md:col-span-2 xl:col-span-1">
            <AiAnalysis />
          </div>

        </div>

      </main>

      {/* ── Footer — sibling of main so flex-col pushes it to the bottom ── */}
      <footer className="border-t border-border px-4 py-4 lg:px-6">
        <div className="flex flex-col gap-1 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>aether-daemon</span>
                    <VersionDisplay
            className="text-xs text-muted-foreground"
            titleLabel="Daemon version"
          />
          <span className="text-muted-foreground/50">{data ? `host ${data.ip}` : 'host —'} · {time || '—'}</span>
        </div>
      </footer>
    </div>
  );
}
