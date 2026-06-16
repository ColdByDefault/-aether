'use client';

import { useState } from 'react';
import { Activity, ChevronDown } from 'lucide-react';
import type { SystemEvent } from '@/app/api/events/route';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSystemDataContext } from '@/context/system-data-context';

function severityDot(severity: SystemEvent['severity']): string {
  if (severity === 'error') return 'bg-destructive';
  if (severity === 'warn') return 'bg-chart-4';
  return 'bg-primary';
}

function formatTime(iso: string): string {
  return new Date(iso).toTimeString().slice(0, 5);
}

export function EventFeed() {
  const { events, connected } = useSystemDataContext();
  const [open, setOpen] = useState(false);
  const loading = events.length === 0 && !connected;
  const error = !connected && events.length === 0 ? 'connecting...' : null;

  return (
    <section id="events" className="scroll-mt-20">
      <Collapsible open={open} onOpenChange={setOpen} className="panel">
        <div className="panel-header">
          <Activity className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Recent Events</span>
          <span className="flex-1 border-t border-border" />
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <span className={`term-dot h-1.5 w-1.5 ${error ? 'bg-destructive' : 'bg-primary'}`} />
            {!connected ? 'reconnecting...' : loading ? 'connecting...' : 'live · ws'}
          </span>
          <CollapsibleTrigger className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer">
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          {error && (
            <div className="border-b border-border px-4 py-2.5 font-mono text-sm text-destructive">
              ERR: {error}
            </div>
          )}

          <div className="divide-y divide-border">
            {loading && !error && (
              <div className="px-4 py-3 font-mono text-sm text-muted-foreground">
                reading events...
              </div>
            )}
            {!loading && events.length === 0 && !error && (
              <div className="px-4 py-3 font-mono text-sm text-muted-foreground">
                no events in the last 24h
              </div>
            )}
            {events.map((event) => (
              <div key={event.id} className="flex items-center gap-4 px-4 py-3 font-mono text-sm">
                <span className="w-11 shrink-0 tabular-nums text-muted-foreground/70">
                  {formatTime(event.time)}
                </span>
                <span className={`term-dot h-1.5 w-1.5 shrink-0 ${severityDot(event.severity)}`} />
                <span className="text-foreground">{event.message}</span>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
