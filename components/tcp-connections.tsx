'use client';

import { ArrowLeftRight } from 'lucide-react';
import { PanelHeader } from '@/components/panel-header';
import { useSystemDataContext } from '@/context/system-data-context';

export function TcpConnections() {
  const { status: data } = useSystemDataContext();

  if ((data?.tcpConnections?.length ?? 0) === 0) return null;

  return (
    <div className="panel">
      <PanelHeader
        icon={ArrowLeftRight}
        label="TCP"
        right={`${data!.tcpConnections.length} established`}
      />
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
  );
}
