'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Monitor, Network, ScrollText, TerminalSquare, SquareLibrary, ArrowRight } from 'lucide-react';
import { HeroSection } from '@/components/hero-section';

const SECTIONS = [
  {
    href: '/system',
    icon: Monitor,
    title: 'System',
    description: 'CPU, memory, storage, temperature, swap & power metrics.',
    items: ['System Overview', 'CPU Temperature', 'Swap Usage', 'Power'],
  },
  {
    href: '/api-network',
    icon: Network,
    title: 'API & Network',
    description: 'Live health checks across services, endpoints & open ports.',
    items: ['Service Probe', 'API Health', 'Open Ports'],
  },
  {
    href: '/logs',
    icon: ScrollText,
    title: 'Logs',
    description: 'AI-powered health analysis and a live stream of system events.',
    items: ['AI Health Analysis', 'Recent Events'],
  },
  {
    href: '/terminal',
    icon: TerminalSquare,
    title: 'Terminal',
    description: 'Browser-based shell for quick commands on the host.',
    items: [],
  },
  {
    href: '/library',
    icon: SquareLibrary,
    title: 'Library',
    description: 'Upload and read PDF & Markdown documents in the browser.',
    items: [],
  },
];

export default function Page() {
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
      <main className="flex-1 px-4 py-4 lg:px-6 lg:py-5">

        {/* Hero */}
        <div className="mb-8">
          <HeroSection />
        </div>

        {/* Section label */}
        <div className="mb-4 flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span className="uppercase tracking-wider">sections</span>
          <span className="flex-1 border-t border-border" />
        </div>

        {/* Nav card grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {SECTIONS.map(({ href, icon: Icon, title, description, items }) => (
            <Link
              key={href}
              href={href}
              className="group panel flex flex-col gap-3 p-5 transition-colors hover:border-primary/40 hover:bg-muted/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 font-mono text-sm font-semibold text-foreground">
                  <Icon className="h-4 w-4 text-primary" />
                  {title.toLowerCase()}
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>

              <p className="font-mono text-xs leading-relaxed text-muted-foreground">
                {description}
              </p>

              {items.length > 0 && (
                <ul className="mt-auto flex flex-wrap gap-x-3 gap-y-1">
                  {items.map((item) => (
                    <li key={item} className="font-mono text-[11px] text-muted-foreground/50">
                      · {item}
                    </li>
                  ))}
                </ul>
              )}
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-4 lg:px-6">
        <div className="flex flex-col gap-1 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>aether-daemon</span>
          <span className="text-muted-foreground/50">{time || '—'}</span>
        </div>
      </footer>
    </div>
  );
}
