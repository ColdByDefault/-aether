'use client';

import { Network } from 'lucide-react';
import { PanelHeader } from '@/components/panel-header';
import { useSystemDataContext } from '@/context/system-data-context';

export function OpenPorts() {
  const { status: data } = useSystemDataContext();

  if ((data?.openPorts?.length ?? 0) === 0) return null;

  return (
    <div className="panel">
      <PanelHeader
        icon={Network}
        label="Open Ports"
        right={
          <span className="inline-flex items-center gap-1.5">
            {data!.openPorts.length} listening
          </span>
        }
      />
      <div className="divide-y divide-border">
        {data!.openPorts.map((p) => (
          <div
            key={`${p.protocol}-${p.port}-${p.address}`}
            className="flex items-center gap-3 px-4 py-2 font-mono text-xs"
          >
            <span className="w-8 shrink-0 uppercase text-muted-foreground/60">{p.protocol}</span>
            <span className="w-12 shrink-0 text-right font-semibold text-foreground">{p.port}</span>
            <span className="min-w-0 flex-1 truncate text-muted-foreground/70">{p.address}</span>
            <span className="shrink-0 text-muted-foreground/50">{p.process}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
