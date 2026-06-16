'use client';

import { Server } from 'lucide-react';
import { PanelHeader } from '@/components/panel-header';
import { useSystemDataContext } from '@/context/system-data-context';

export function ServiceProbe() {
  const { status: data, connected } = useSystemDataContext();

  return (
    <div className="panel flex h-auto flex-col">
      <PanelHeader
        icon={Server}
        label="Service Probe"
        right={data?.ip ? `ip ${data.ip}` : undefined}
      />
      <div className="flex-1 divide-y divide-border overflow-auto">
        {!data && (
          <div className="px-4 py-3 font-mono text-sm text-muted-foreground">
            {connected ? 'probing...' : 'connecting...'}
          </div>
        )}
        {data?.services?.map((service) => (
          <div key={service.name}>
            <div className="flex items-center justify-between px-4 py-3 font-mono text-sm">
              <div className="flex items-center gap-3">
                <span className={`term-dot h-2 w-2 ${service.running ? 'bg-primary' : 'bg-destructive'}`} />
                <span className="text-foreground">
                  {service.name.toLowerCase().replace(/\s+/g, '-')}
                </span>
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
                    ? [...c.ports.matchAll(/(?:0\.0\.0\.0|::):(\d+)->/g)]
                        .map((m) => ':' + m[1])
                        .join(' ')
                    : '';
                  const running = c.status.toLowerCase().startsWith('up');
                  return (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 py-2 pl-10 pr-4 font-mono text-xs text-muted-foreground"
                    >
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
  );
}
