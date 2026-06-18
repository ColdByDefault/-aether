'use client';

import { Container, ExternalLink, Play, Square } from 'lucide-react';
import { PanelHeader } from '@/components/panel-header';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DOZZLE_URL, useDozzleCard } from './dozzle-card.logic';

export function DozzleCard() {
  const { status, pending, error, toggle } = useDozzleCard();

  const loading = status === null;
  const running = status?.running ?? false;
  const notFound = status !== null && !status.found;

  return (
    <div className="panel flex flex-col">
      <PanelHeader
        icon={Container}
        label="Dozzle Container"
        right={
          loading
            ? 'checking…'
            : notFound
              ? 'not found'
              : running
                ? 'up'
                : 'down'
        }
      />

      <div className="flex items-center justify-between gap-3 px-4 py-3 font-mono text-sm">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              'term-dot h-2 w-2 shrink-0',
              loading && 'bg-muted-foreground/40',
              !loading && running && 'bg-primary',
              !loading && !running && 'bg-destructive',
            )}
          />
          <span className="min-w-0 truncate text-foreground">
            {status?.name || 'dozzle'}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            disabled={loading || pending || notFound}
            onClick={toggle}
          >
            {running ? (
              <Square className={cn('h-3 w-3', pending && 'animate-pulse')} />
            ) : (
              <Play className={cn('h-3 w-3', pending && 'animate-pulse')} />
            )}
            {pending ? (running ? 'stopping…' : 'starting…') : running ? 'stop' : 'start'}
          </Button>

          <a
            href={DOZZLE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            open
          </a>
        </div>
      </div>

      {error && (
        <div className="border-t border-destructive/30 bg-destructive/5 px-4 py-2 font-mono text-xs text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
