import type { SystemEvent } from '@/app/api/events/route';

const OLLAMA_HOST = `http://host.docker.internal:${process.env.OLLAMA_PORT ?? '11434'}`;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'qwen3:8b';

interface MetricsData {
  cpu: { usedPercent: number; cores: number; loadAvg: number[] };
  memory: { total: number; used: number; free: number; usedPercent: number };
  disk: { total: number; used: number; available: number; usedPercent: number; mount: string }[];
}

interface ServiceStatus { name: string; running: boolean }
interface CronJob { name: string; enabled: boolean; state: string; nextRun: string | null }
interface StatusData { services: ServiceStatus[]; cronJobs: CronJob[] }

export interface AnalysisResult {
  analysis: string;
  model: string;
  timestamp: string;
  nextRun: string;
  auto: boolean;
}

let lastResult: AnalysisResult | null = null;

function fmtGb(bytes: number) { return `${(bytes / 1073741824).toFixed(1)} GB`; }

function buildPrompt(
  metrics: MetricsData | null,
  status: StatusData | null,
  events: SystemEvent[],
): string {
  const lines: string[] = [
    'You are a concise server health assistant.',
    'Analyze this system snapshot and respond with 3–6 bullet point observations.',
    'Flag issues clearly. If everything is healthy, say so briefly.',
    '',
  ];

  if (metrics) {
    lines.push('=== SYSTEM ===');
    lines.push(
      `CPU: ${metrics.cpu.usedPercent.toFixed(1)}%` +
      ` (${metrics.cpu.cores} cores, load ${metrics.cpu.loadAvg.map(n => n.toFixed(2)).join(' / ')})`,
    );
    lines.push(
      `RAM: ${metrics.memory.usedPercent.toFixed(1)}% used` +
      ` (${fmtGb(metrics.memory.used)} / ${fmtGb(metrics.memory.total)}, ${fmtGb(metrics.memory.free)} free)`,
    );
    for (const d of metrics.disk) {
      lines.push(`Disk ${d.mount}: ${d.usedPercent.toFixed(1)}% used, ${fmtGb(d.available)} free`);
    }
    lines.push('');
  }

  if (status) {
    lines.push('=== SERVICES ===');
    lines.push(status.services.map(s => `${s.name}: ${s.running ? 'up' : 'DOWN'}`).join(' | '));
    if (status.cronJobs.length > 0) {
      lines.push('=== CRON ===');
      lines.push(
        status.cronJobs
          .map(j =>
            `${j.name}: ${j.enabled ? j.state : 'disabled'}` +
            (j.nextRun ? ` (next ${new Date(j.nextRun).toISOString().slice(5, 16).replace('T', ' ')})` : ''),
          )
          .join(' | '),
      );
    }
    lines.push('');
  }

  if (events.length > 0) {
    lines.push('=== RECENT EVENTS (24h) ===');
    for (const e of events.slice(0, 10)) {
      lines.push(`${new Date(e.time).toTimeString().slice(0, 5)} ${e.message}`);
    }
    lines.push('');
  }

  lines.push('Observations:');
  return lines.join('\n');
}

async function gatherData() {
  const base = 'http://localhost:3000';
  const [metrics, status, events] = await Promise.allSettled([
    fetch(`${base}/api/metrics`, { signal: AbortSignal.timeout(5000) }).then(r => r.ok ? r.json() : null),
    fetch(`${base}/api/status`,  { signal: AbortSignal.timeout(5000) }).then(r => r.ok ? r.json() : null),
    fetch(`${base}/api/events`,  { signal: AbortSignal.timeout(5000) }).then(r => r.ok ? r.json() : []),
  ]);
  return {
    metrics: metrics.status === 'fulfilled' ? (metrics.value as MetricsData | null) : null,
    status:  status.status  === 'fulfilled' ? (status.value  as StatusData  | null) : null,
    events:  events.status  === 'fulfilled' ? (events.value  as SystemEvent[])      : [],
  };
}

function nextScheduledTime(): Date {
  const hour   = parseInt(process.env.ANALYZE_HOUR   ?? '8', 10);
  const minute = parseInt(process.env.ANALYZE_MINUTE ?? '0', 10);
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (next <= new Date()) next.setDate(next.getDate() + 1);
  return next;
}

async function runAnalysis(auto = false): Promise<AnalysisResult | { error: string }> {
  const data = await gatherData();
  const prompt = buildPrompt(data.metrics, data.status, data.events);

  try {
    const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false, think: false }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!res.ok) {
      const text = await res.text();
      return { error: `Ollama ${res.status}: ${text.slice(0, 200)}` };
    }

    const json = await res.json();
    const result: AnalysisResult = {
      analysis: (json.response as string).trim(),
      model: OLLAMA_MODEL,
      timestamp: new Date().toISOString(),
      nextRun: nextScheduledTime().toISOString(),
      auto,
    };
    lastResult = result;
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { error: `Ollama unreachable: ${msg}` };
  }
}

function scheduleDailyAnalysis() {
  const next = nextScheduledTime();
  const delay = next.getTime() - Date.now();
  setTimeout(() => {
    runAnalysis()
      .then(r => 'error' in r
        ? console.error('[analyze] scheduled run failed:', r.error)
        : console.log('[analyze] scheduled run complete at', r.timestamp),
      )
      .catch(err => console.error('[analyze] scheduled run error:', err))
      .finally(() => scheduleDailyAnalysis());
  }, delay);
  console.log(`[analyze] next auto-run scheduled for ${next.toISOString()}`);
}

scheduleDailyAnalysis();

export async function GET(): Promise<Response> {
  const nextRun = nextScheduledTime().toISOString();
  if (!lastResult) {
    return Response.json({ nextRun }, { status: 404 });
  }
  return Response.json({ ...lastResult, nextRun });
}

export async function POST(): Promise<Response> {
  const result = await runAnalysis();
  if ('error' in result) {
    return Response.json({ error: result.error }, { status: 502 });
  }
  return Response.json(result);
}
