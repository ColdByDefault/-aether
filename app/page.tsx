'use client';

import { useState, useEffect } from 'react';
import { Monitor, Zap, MessagesSquare, Activity, Bot, Container, TerminalSquare } from 'lucide-react';
import { useSystemDataContext } from '@/context/system-data-context';
import { SystemMetrics } from '@/components/system-metrics';
import { PowerMetrics } from '@/components/power-metrics';
import { EventFeed } from '@/components/event-feed';
import { AiAnalysis } from '@/components/ai-analysis';
import { ThemeToggle } from '@/components/theme-toggle';
import VersionDisplay from '@/components/VersionDisplay';
import { CpuTemp } from '@/components/cpu-temp';
import { SwapUsage } from '@/components/swap-usage';
import { HeroSection } from '@/components/hero-section';
import { ServiceProbe } from '@/components/service-probe';
import { OpenPorts } from '@/components/open-ports';
import { TcpConnections } from '@/components/tcp-connections';
import { HermesCron } from '@/components/hermes-cron';
import { ApiHealthCard } from '@/components/api-health-card';
import Link from 'next/link';

const NAV = [
  { id: 'system',    label: 'System',    Icon: Monitor        },
  { id: 'power',     label: 'Power',     Icon: Zap            },
  { id: 'events',    label: 'Events',    Icon: Activity       },
  { id: 'ai',        label: 'AI',        Icon: Bot            },
  { id: 'terminal',  label: 'Terminal',  Icon: TerminalSquare },
];

export default function Page() {
  const { status: data } = useSystemDataContext();
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    setTime(new Date().toISOString().replace('T', ' ').slice(0, 19) + 'Z');
    const ti = setInterval(
      () => setTime(new Date().toISOString().replace('T', ' ').slice(0, 19) + 'Z'),
      1000,
    );
    return () => clearInterval(ti);
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
              <Link
                key={id}
                href={id === 'terminal' ? '/terminal' : `#${id}`}
                className="flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-4 sm:flex">
            <Link
              href="http://192.168.2.100:3002/"
              target="_blank"
              className="items-center gap-2 font-mono text-xs text-muted-foreground sm:flex hover:text-foreground"
            >
              <Container className="h-3.5 w-3.5" />
              <span>Dozzle</span>
            </Link>
            <Link
              href="http://192.168.2.100:3003/"
              target="_blank"
              className="items-center gap-2 font-mono text-xs text-muted-foreground sm:flex hover:text-foreground"
            >
              <MessagesSquare className="h-3.5 w-3.5" />
              <span>WebUI</span>
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* ── Main grid ── */}
      <main className="flex-1 px-4 py-4 lg:px-6 lg:py-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

          {/* ROW 1: Hero */}
          <div className="md:col-span-2 xl:col-span-4">
            <HeroSection />
          </div>

          {/* ROW 2: System Metrics + Power + Service Probe */}
          <div className="md:col-span-2 xl:col-span-2 h-175 flex flex-col">
            <SystemMetrics />
          </div>
          <div className="xl:col-span-1">
            <PowerMetrics />
          </div>
          <div className="xl:col-span-1">
            <ServiceProbe />
          </div>

          {/* ROW 3: CPU Temp + Swap */}
          <div className="md:col-span-1 xl:col-span-2">
            <CpuTemp />
          </div>
          <div className="md:col-span-1 xl:col-span-2">
            <SwapUsage />
          </div>

          {/* ROW 4: API Health */}
          <div className="md:col-span-2 xl:col-span-2">
            <ApiHealthCard />
          </div>

          {/* ROW 5: Events + AI + Network/Cron stack */}
          <div className="md:col-span-2 xl:col-span-2">
            <EventFeed />
          </div>
          <div className="md:col-span-2 xl:col-span-1">
            <AiAnalysis />
          </div>
          <div className="md:col-span-2 xl:col-span-1 flex flex-col gap-4">
            <OpenPorts />
            <TcpConnections />
            <HermesCron />
          </div>

        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border px-4 py-4 lg:px-6">
        <div className="flex flex-col gap-1 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>aether-daemon</span>
          <VersionDisplay className="text-xs text-muted-foreground" titleLabel="Daemon version" />
          <span className="text-muted-foreground/50">
            {data ? `host ${data.ip}` : 'host —'} · {time || '—'}
          </span>
        </div>
      </footer>
    </div>
  );
}
