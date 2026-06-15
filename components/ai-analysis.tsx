'use client';

import { useState } from 'react';
import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnalysisResult {
  analysis: string;
  model: string;
  timestamp: string;
}

function parseObservations(text: string): string[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const bullets = lines
    .filter(l => /^[-•*]/.test(l))
    .map(l => l.replace(/^[-•*]\s*/, ''));
  return bullets.length > 0 ? bullets : lines;
}

export function AiAnalysis() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analyze', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? 'Analysis failed');
      setResult(data as AnalysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const observations = result ? parseObservations(result.analysis) : [];

  return (
    <section id="ai" className="scroll-mt-20">
      <div className="mb-3 flex items-center gap-2 font-mono text-xs text-muted-foreground">
        <Bot className="h-3.5 w-3.5 text-primary" />
        <span className="uppercase tracking-wider">AI Health Analysis</span>
        <span className="flex-1 border-t border-border" />
        {result && (
          <span className="text-muted-foreground/60">
            {result.model} · {new Date(result.timestamp).toTimeString().slice(0, 5)}
          </span>
        )}
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="font-mono text-xs text-muted-foreground">
            {loading ? 'querying model...' : result ? 'analysis ready' : 'idle'}
          </span>
          <span className="flex-1" />
          <Button
            variant="link"
            size="xs"
            onClick={analyze}
            disabled={loading}
            className="font-mono h-auto px-0 text-primary"
          >
            {loading ? '...' : 'Analyze System ▶'}
          </Button>
        </div>

        {error && (
          <div className="border-t border-border px-4 py-3 font-mono text-sm text-destructive">
            ERR: {error}
          </div>
        )}

        {!result && !error && !loading && (
          <div className="px-4 py-8 text-center font-mono text-sm text-muted-foreground">
            press Analyze System to run a health check
          </div>
        )}

        {loading && (
          <div className="px-4 py-8 text-center font-mono text-sm text-muted-foreground">
            querying model...
          </div>
        )}

        {result && !loading && (
          <div className="px-4 py-4">
            <p className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Observations
            </p>
            <ul className="space-y-2">
              {observations.map((line, i) => (
                <li key={i} className="flex items-start gap-2 font-mono text-sm">
                  <span className="accent-text mt-px shrink-0">—</span>
                  <span className="text-foreground">{line}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
