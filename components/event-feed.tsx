'use client';

import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import type { SystemEvent } from '@/app/api/events/route';

function severityDot(severity: SystemEvent['severity']): string {
  if (severity === 'error') return 'bg-destructive';
  if (severity === 'warn') return 'bg-chart-4';
  return 'bg-primary';
}

function formatTime(iso: string): string {
  return new Date(iso).toTimeString().slice(0, 5);
}

export function EventFeed() {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/events');
        if (!res.ok) throw new Error('Failed to fetch events');
        const data: SystemEvent[] = await res.json();
        if (!active) return;
        setEvents(data);
        setError(null);
        setLoading(false);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 30_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <section id="events" className="scroll-mt-20">
      <div className="mb-3 flex items-center gap-2 font-mono text-xs text-muted-foreground">
        <Activity className="h-3.5 w-3.5 text-primary" />
        <span className="uppercase tracking-wider">Recent Events</span>
        <span className="flex-1 border-t border-border" />
        <span className="inline-flex items-center gap-1.5">
          <span className={`term-dot h-1.5 w-1.5 ${error ? 'bg-destructive' : 'bg-primary'}`} />
          {error ? 'error' : loading ? 'polling' : 'live · 30s'}
        </span>
      </div>

      <div className="panel">
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
      </div>
    </section>
  );
}
