'use client';

import { useState } from 'react';
import { Play, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  jobId: string;
}

type State = 'idle' | 'loading' | 'ok' | 'error';

export function HermesTriggerButton({ jobId }: Props) {
  const [state, setState] = useState<State>('idle');

  const trigger = async () => {
    if (state === 'loading') return;
    setState('loading');
    try {
      const res = await fetch('/api/hermes/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      setState(res.ok ? 'ok' : 'error');
    } catch {
      setState('error');
    }
    setTimeout(() => setState('idle'), 2500);
  };

  const icon =
    state === 'loading' ? <Loader2 className="h-3 w-3 animate-spin" /> :
    state === 'ok'      ? <Check className="h-3 w-3" /> :
    state === 'error'   ? <AlertCircle className="h-3 w-3" /> :
                          <Play className="h-3 w-3" />;

  const label =
    state === 'loading' ? 'running…' :
    state === 'ok'      ? 'triggered' :
    state === 'error'   ? 'failed' :
                          'run';

  const colorClass =
    state === 'ok'    ? 'accent-text border-primary/40' :
    state === 'error' ? 'text-destructive border-destructive/40' :
                        'text-muted-foreground/60 border-border/40 hover:border-border hover:text-muted-foreground';

  return (
    <Button
      onClick={trigger}
      disabled={state === 'loading'}
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] transition-colors disabled:pointer-events-none ${colorClass}`}
    >
      {icon}
      {label}
    </Button>
  );
}
