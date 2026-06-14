import { exec } from 'child_process';
import { promisify } from 'util';
import http from 'http';

const execAsync = promisify(exec);

interface ServiceStatus {
  name: string;
  running: boolean;
  error?: string;
}

interface CronJob {
  id: string;
  name: string;
  enabled: boolean;
  state: string;
  schedule: string;
  nextRun: string | null;
  lastStatus: string | null;
  lastError: string | null;
}

interface StatusResponse {
  ip: string;
  timestamp: string;
  services: ServiceStatus[];
  cronJobs: CronJob[];
}

interface RawCronJob {
  id: string;
  name: string;
  enabled: boolean;
  state: string;
  schedule_display?: string;
  schedule?: { expr?: string };
  next_run_at?: string | null;
  last_status?: string | null;
  last_error?: string | null;
}

function httpGet(url: string, timeoutMs: number, headers?: Record<string, string>): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: timeoutMs, headers }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function checkHttp(name: string, url: string): Promise<ServiceStatus> {
  try {
    const { status } = await httpGet(url, 3000);
    return { name, running: status >= 200 && status < 500 };
  } catch {
    return { name, running: false, error: 'Unreachable' };
  }
}

async function checkDocker(): Promise<ServiceStatus> {
  try {
    await execAsync('docker ps > /dev/null 2>&1');
    return { name: 'Docker', running: true };
  } catch {
    return { name: 'Docker', running: false, error: 'docker ps failed' };
  }
}

async function checkHermesWithCron(
  host: string,
  port: string
): Promise<{ service: ServiceStatus; cronJobs: CronJob[] }> {
  try {
    const { status, body: html } = await httpGet(`http://${host}:${port}/`, 5000);

    if (status < 200 || status >= 500 || !html.includes('__HERMES_SESSION_TOKEN__')) {
      return { service: { name: 'Hermes Agent', running: false, error: 'Unexpected response' }, cronJobs: [] };
    }

    const service: ServiceStatus = { name: 'Hermes Agent', running: true };
    const match = html.match(/__HERMES_SESSION_TOKEN__="([^"]+)"/);
    if (!match) return { service, cronJobs: [] };

    const { body: cronRaw } = await httpGet(
      `http://${host}:${port}/api/cron/jobs`,
      5000,
      { Authorization: `Bearer ${match[1]}` }
    );

    const parsed: unknown = JSON.parse(cronRaw);
    if (!Array.isArray(parsed)) return { service, cronJobs: [] };

    const cronJobs: CronJob[] = (parsed as RawCronJob[]).map((j) => ({
      id: j.id,
      name: j.name,
      enabled: j.enabled,
      state: j.state,
      schedule: j.schedule_display ?? j.schedule?.expr ?? '',
      nextRun: j.next_run_at ?? null,
      lastStatus: j.last_status ?? null,
      lastError: j.last_error ?? null,
    }));

    return { service, cronJobs };
  } catch {
    return { service: { name: 'Hermes Agent', running: false, error: 'Unreachable' }, cronJobs: [] };
  }
}

// Background refresh — computes once every 30s, requests always read from memory.
let latest: StatusResponse | null = null;
let activeRefresh: Promise<void> | null = null;

async function refresh(): Promise<void> {
  if (activeRefresh) return activeRefresh;
  activeRefresh = (async () => {
    try {
      const ip = process.env.SERVER_IP || 'unknown';
      const host = 'host.docker.internal';
      const hermesPort = process.env.HERMES_PORT || '9119';
      const nginxPort = process.env.NGINX_PORT || '80';

      const [hermes, docker, nginx] = await Promise.all([
        checkHermesWithCron(host, hermesPort),
        checkDocker(),
        checkHttp('Nginx', `http://${host}:${nginxPort}/`),
      ]);

      latest = {
        ip,
        timestamp: new Date().toISOString(),
        services: [docker, hermes.service, nginx],
        cronJobs: hermes.cronJobs,
      };
    } catch (err) {
      console.error('Status refresh error:', err);
    } finally {
      activeRefresh = null;
    }
  })();
  return activeRefresh;
}

refresh();
setInterval(refresh, 30_000);

export async function GET(): Promise<Response> {
  if (!latest) await refresh();
  return latest
    ? Response.json(latest)
    : Response.json({ error: 'Status not yet available' }, { status: 503 });
}
