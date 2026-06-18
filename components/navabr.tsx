'use client';

import { Monitor, Network, ScrollText, TerminalSquare, SquareLibrary, Key } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme/theme-toggle';

const NAV = [
  { id: "/system", label: "System", Icon: Monitor },
  { id: "/api-network", label: "API & Network", Icon: Network },
  { id: "/logs", label: "Logs", Icon: ScrollText },
  { id: "/terminal", label: "Terminal", Icon: TerminalSquare },
  { id: "/secret-manager", label: "Secret Manager", Icon: Key },
  { id: "/library", label: "Library", Icon: SquareLibrary },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-0 lg:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-sm">
            <span className="accent-text">▮</span>
            <Link href="/" className="font-bold text-foreground">
                <span className="font-semibold text-foreground">aether</span>
                <span className="text-muted-foreground">/ daemon</span>
            </Link>
          </div>

          <div className="lg:hidden">
            <ThemeToggle />
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-muted-foreground">
          {NAV.map(({ id, label, Icon }) => (
            <Link
              key={id}
              href={id}
              className="flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
