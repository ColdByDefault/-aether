'use client';

import { useState, useEffect } from 'react';
import { Globe, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSystemDataContext } from '@/context/system-data-context';

export function HeroSection() {
  const { status: data, connected } = useSystemDataContext();
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
    <section className="relative overflow-hidden border border-border bg-card aspect-[4/1] min-h-[140px]">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/background.png')", opacity: 0.35 }}
      />
      <div className="relative z-10 px-8 py-10 flex flex-wrap items-end justify-between gap-6 h-full">
        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            aether · system monitoring daemon
          </p>
          <h1 className="font-mono text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
            server{' '}
            <span className="text-primary">dashboard</span>
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1.5 font-mono text-xs font-normal text-muted-foreground bg-muted/40 h-auto py-1 rounded-sm">
              <span className={`term-dot h-1.5 w-1.5 ${connected ? 'bg-green-500' : 'bg-destructive'}`} />
              {connected ? 'online' : 'offline'}
            </Badge>
            {data?.ip && (
              <Badge variant="outline" className="gap-1.5 font-mono text-xs font-normal text-muted-foreground bg-muted/40 h-auto py-1 rounded-sm">
                <Globe className="h-3 w-3" />
                {data.ip}
              </Badge>
            )}
            <Badge variant="outline" className="gap-1.5 font-mono text-xs font-normal text-muted-foreground bg-muted/40 h-auto py-1 rounded-sm">
              <Clock className="h-3 w-3" />
              {time || '—'}
            </Badge>
          </div>
        </div>
      </div>
    </section>
  );
}
