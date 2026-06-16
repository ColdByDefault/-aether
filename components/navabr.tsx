'use client';

import { Monitor, Zap, Activity, Bot, TerminalSquare, Container } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

const NAV = [
  { id: 'system',   label: 'System',   Icon: Monitor        },
  { id: 'power',    label: 'Power',    Icon: Zap            },
  { id: 'events',   label: 'Events',   Icon: Activity       },
  { id: 'ai',       label: 'AI',       Icon: Bot            },
  { id: 'terminal', label: 'Terminal', Icon: TerminalSquare },
];

export function Navbar() {
  return (
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
            href="/library"
            target="_blank"
            className="items-center gap-2 font-mono text-xs text-muted-foreground sm:flex hover:text-foreground"
          >
            <span>Library</span>
          </Link>
          <Link
            href="http://192.168.2.100:3002/"
            target="_blank"
            className="items-center gap-2 font-mono text-xs text-muted-foreground sm:flex hover:text-foreground"
          >
            <Container className="h-3.5 w-3.5" />
            <span>Dozzle</span>
          </Link>
        </div>

        <ThemeToggle />
      </div>
    </header>
  );
}
