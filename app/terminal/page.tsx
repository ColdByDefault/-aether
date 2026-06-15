'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, TerminalSquare } from 'lucide-react';

type Status = 'connecting' | 'connected' | 'disconnected' | 'error';

export default function TerminalPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>('connecting');
  const [sessionCount, setSessionCount] = useState(0);

  const startSession = useCallback(async () => {
    if (!containerRef.current) return;

    setStatus('connecting');

    // Dynamically import browser-only xterm modules
    const [
      { Terminal },
      { FitAddon },
      { WebLinksAddon },
    ] = await Promise.all([
      import('@xterm/xterm'),
      import('@xterm/addon-fit'),
      import('@xterm/addon-web-links'),
    ]);

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: '"Geist Mono", "JetBrains Mono", "Fira Code", monospace',
      fontSize: 14,
      lineHeight: 1.4,
      scrollback: 5000,
      theme: {
        background:        '#0a0a0a',
        foreground:        '#e2e8f0',
        cursor:            '#22c55e',
        cursorAccent:      '#0a0a0a',
        selectionBackground: 'rgba(34,197,94,0.25)',
        black:             '#1e1e2e',
        red:               '#ef4444',
        green:             '#22c55e',
        yellow:            '#eab308',
        blue:              '#3b82f6',
        magenta:           '#a855f7',
        cyan:              '#06b6d4',
        white:             '#e2e8f0',
        brightBlack:       '#374151',
        brightRed:         '#f87171',
        brightGreen:       '#4ade80',
        brightYellow:      '#fbbf24',
        brightBlue:        '#60a5fa',
        brightMagenta:     '#c084fc',
        brightCyan:        '#22d3ee',
        brightWhite:       '#f8fafc',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());
    term.open(containerRef.current);
    fitAddon.fit();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/terminal`);

    ws.onopen = () => {
      setStatus('connected');
      ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
      term.focus();
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'output') term.write(msg.data);
        if (msg.type === 'exit')   setStatus('disconnected');
      } catch {}
    };

    ws.onclose = () => setStatus('disconnected');
    ws.onerror = () => setStatus('error');

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }));
      }
    });

    const handleResize = () => {
      fitAddon.fit();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      ws.close();
      term.dispose();
    };
  }, [sessionCount]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    startSession().then((fn) => { cleanup = fn; });
    return () => { cleanup?.(); };
  }, [startSession]);

  const statusColor =
    status === 'connected'    ? 'text-green-500' :
    status === 'connecting'   ? 'text-yellow-500' :
    /* disconnected / error */  'text-destructive';

  return (
    <div className="flex h-screen flex-col bg-[#0a0a0a]">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-background/90 backdrop-blur px-4 py-2.5">
        <div className="flex items-center gap-3 font-mono text-xs">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            dashboard
          </Link>
          <span className="text-border">/</span>
          <span className="flex items-center gap-1.5 text-foreground">
            <TerminalSquare className="h-3.5 w-3.5 text-primary" />
            terminal
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <span className={statusColor}>{status}</span>
          {(status === 'disconnected' || status === 'error') && (
            <button
              onClick={() => setSessionCount((n) => n + 1)}
              className="border border-border px-2 py-0.5 text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              reconnect
            </button>
          )}
        </div>
      </header>

      {/* Terminal container */}
      <div className="relative flex-1 overflow-hidden">
        {/* xterm mounts here */}
        <div ref={containerRef} className="absolute inset-0 p-2" />

        {/* Connecting overlay */}
        {status === 'connecting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]">
            <span className="font-mono text-sm text-muted-foreground">connecting...</span>
          </div>
        )}
      </div>
    </div>
  );
}
