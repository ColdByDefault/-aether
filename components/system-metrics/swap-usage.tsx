'use client';

import { DatabaseZap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useSystemDataContext } from '@/context/system-data-context';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function swapBarClass(percent: number): string {
  if (percent >= 80) return '[&>div]:bg-destructive';
  if (percent >= 50) return '[&>div]:bg-chart-4';
  return '';
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline gap-3 font-mono text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className="flex-1 border-b border-dashed border-border/60" />
      <span className="text-foreground">{v}</span>
    </div>
  );
}

export function SwapUsage() {
  const { hardware: data, connected } = useSystemDataContext();
  const loading = data === null;
  const error = !connected && loading ? 'connecting...' : null;

  const swap = data?.swap;
  const noSwap = swap && swap.total === 0;

  return (
    <section id="swap" className="scroll-mt-20 h-full flex flex-col">
      <div className="mb-3 flex shrink-0 items-center gap-2 font-mono text-xs text-muted-foreground">
        <DatabaseZap className="h-3.5 w-3.5 text-primary" />
        <span className="uppercase tracking-wider">Swap Usage</span>
        <span className="flex-1 border-t border-border" />
        <span className="inline-flex items-center gap-1.5">
          <span className={`term-dot h-1.5 w-1.5 ${error ? 'bg-destructive' : 'bg-primary'}`} />
          {!connected ? 'reconnecting...' : loading ? 'connecting...' : 'live · ws'}
        </span>
      </div>

      <div className="panel flex-1 min-h-0 overflow-hidden p-4">
        {error && (
          <p className="font-mono text-sm text-destructive">ERR: {error}</p>
        )}

        {loading && !swap && (
          <p className="font-mono text-sm text-muted-foreground">reading swap...</p>
        )}

        {noSwap && (
          <p className="font-mono text-sm text-muted-foreground">no swap configured</p>
        )}

        {swap && swap.total > 0 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between font-mono text-sm">
                <span className="text-muted-foreground">usage</span>
                <span className="tabular-nums text-foreground">
                  {swap.usedPercent.toFixed(1)}%
                </span>
              </div>
              <Progress
                value={swap.usedPercent}
                className={`h-1.5 ${swapBarClass(swap.usedPercent)}`}
              />
              <p className="text-right font-mono text-xs text-muted-foreground/50">
                {formatBytes(swap.used)} / {formatBytes(swap.total)}
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <Row k="total" v={formatBytes(swap.total)} />
              <Row k="used" v={formatBytes(swap.used)} />
              <Row k="free" v={formatBytes(swap.free)} />
              <Row k="cached" v={formatBytes(swap.cached)} />
            </div>

            {data && (
              <p className="font-mono text-[10px] text-muted-foreground/30">
                sampled {new Date(data.timestamp).toISOString().slice(11, 19)}Z
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
