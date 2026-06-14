import { exec } from 'child_process';
import { promisify } from 'util';

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

async function checkHttp(name: string, url: string): Promise<ServiceStatus> {
  try {
    const { stdout } = await execAsync(
      `curl -s -o /dev/null -w "%{http_code}" --max-time 3 "${url}"`
    );
    const code = parseInt(stdout.trim(), 10);
    const running = code >= 200 && code < 500;
    return { name, running };
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
    const { stdout: html } = await execAsync(
      `curl -s --max-time 5 "http://${host}:${port}/"`
    );

    // If the page doesn't look like the Hermes dashboard, mark it down
    if (!html.includes('__HERMES_SESSION_TOKEN__')) {
      return { service: { name: 'Hermes Agent', running: false, error: 'Unexpected response' }, cronJobs: [] };
    }

    const service: ServiceStatus = { name: 'Hermes Agent', running: true };

    const match = html.match(/__HERMES_SESSION_TOKEN__="([^"]+)"/);
    if (!match) return { service, cronJobs: [] };

    const token = match[1];
    const { stdout: cronRaw } = await execAsync(
      `curl -s --max-time 5 -H "Authorization: Bearer ${token}" "http://${host}:${port}/api/cron/jobs"`
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

export async function GET(): Promise<Response> {
  try {
    const ip = process.env.SERVER_IP || 'unknown';
    const host = 'host.docker.internal';
    const hermesPort = process.env.HERMES_PORT || '9119';
    const ollamaPort = process.env.OLLAMA_PORT || '11434';
    const nginxPort = process.env.NGINX_PORT || '80';
    const timestamp = new Date().toISOString();

    const [hermes, docker, ollama, nginx] = await Promise.all([
      checkHermesWithCron(host, hermesPort),
      checkDocker(),
      checkHttp('Ollama', `http://${host}:${ollamaPort}/`),
      checkHttp('Nginx', `http://${host}:${nginxPort}/`),
    ]);

    const response: StatusResponse = {
      ip,
      timestamp,
      services: [docker, hermes.service, ollama, nginx],
      cronJobs: hermes.cronJobs,
    };

    return Response.json(response);
  } catch (error) {
    console.error('Error fetching status:', error);
    return Response.json(
      { error: 'Failed to fetch system status' },
      { status: 500 }
    );
  }
}
