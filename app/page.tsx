'use client';

import { useState, useEffect } from 'react';
import { useSystemDataContext } from '@/context/system-data-context';
import { SystemMetrics } from '@/components/system-metrics';
import { PowerMetrics } from '@/components/power-metrics';
import { EventFeed } from '@/components/event-feed';
import { AiAnalysis } from '@/components/ai-analysis';
import VersionDisplay from '@/components/VersionDisplay';
import { CpuTemp } from '@/components/cpu-temp';
import { SwapUsage } from '@/components/swap-usage';
import { HeroSection } from '@/components/hero-section';
import { ServiceProbe } from '@/components/service-probe';
import { OpenPorts } from '@/components/open-ports';
import { TcpConnections } from '@/components/tcp-connections';
import { HermesCron } from '@/components/hermes-cron';
import { ApiHealthCard } from '@/components/api-health-card';

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
      {/* ── Main ── */}
      <main className="flex-1 px-4 py-4 lg:px-6 lg:py-5">

        {/* Hero — always full width */}
        <div className="mb-4">
          <HeroSection />
        </div>

        {/*
          Small / medium: single stacked column (flex-col), grouped by topic.
          Large (xl): 2 columns — left holds the always-expanded cards,
          right holds the collapsible cards (API Health, Recent Events, Open Ports).
        */}

        {/* sm / md: stacked, topic-ordered */}
        <div className="flex flex-col gap-4 xl:hidden">
          {/* System Health */}
          <SystemMetrics />
          <CpuTemp />
          <SwapUsage />
          {/* Power & Services */}
          <PowerMetrics />
          <ServiceProbe />
          <ApiHealthCard />
          {/* Activity & AI */}
          <EventFeed />
          <AiAnalysis />
          {/* Network & Automation */}
          <OpenPorts />
          <TcpConnections />
          <HermesCron />
        </div>

        {/* xl+: 2 columns — left = always-expanded, right = collapsible */}
        <div className="hidden gap-4 xl:grid xl:grid-cols-2">
          {/* Left column — always-expanded cards */}
          <div className="flex flex-col gap-4">
            <SystemMetrics />
            <CpuTemp />
            <SwapUsage />
            
            <TcpConnections />
          </div>

          {/* Right column — collapsible cards */}
          <div className="flex flex-col gap-4">
            <ServiceProbe />
            <PowerMetrics />
            <AiAnalysis />
            <HermesCron />
            <ApiHealthCard />
            <EventFeed />
            <OpenPorts />
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
