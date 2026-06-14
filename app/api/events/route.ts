import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface SystemEvent {
  id: string;
  time: string;
  message: string;
  source: 'docker' | 'system';
  severity: 'info' | 'warn' | 'error';
}

interface DockerEvent {
  Type: string;
  Action: string;
  Actor?: { Attributes?: { name?: string } };
  id?: string;
  time: number;
  timeNano?: number;
}

const ACTION_MAP: Record<string, { suffix: string; severity: 'info' | 'warn' | 'error' }> = {
  start:   { suffix: 'started',   severity: 'info' },
  stop:    { suffix: 'stopped',   severity: 'warn' },
  restart: { suffix: 'restarted', severity: 'warn' },
  die:     { suffix: 'died',      severity: 'error' },
  kill:    { suffix: 'killed',    severity: 'error' },
  create:  { suffix: 'created',   severity: 'info' },
  destroy: { suffix: 'destroyed', severity: 'warn' },
  pause:   { suffix: 'paused',    severity: 'info' },
  unpause: { suffix: 'unpaused',  severity: 'info' },
};

async function getDockerEvents(): Promise<SystemEvent[]> {
  const since = Math.floor(Date.now() / 1000) - 86400;
  const until = Math.floor(Date.now() / 1000);

  try {
    const { stdout } = await execAsync(
      `curl -sf --max-time 5 --unix-socket /var/run/docker.sock ` +
      `"http://localhost/events?since=${since}&until=${until}&type=container"`,
      { timeout: 8000 }
    );

    const events: SystemEvent[] = [];
    for (const line of stdout.trim().split('\n')) {
      if (!line) continue;
      try {
        const e: DockerEvent = JSON.parse(line);
        const mapped = ACTION_MAP[e.Action];
        if (!mapped) continue;
        const name = e.Actor?.Attributes?.name ?? e.id?.slice(0, 12) ?? 'container';
        events.push({
          id: `docker-${e.timeNano ?? e.time}-${e.Action}`,
          time: new Date(e.time * 1000).toISOString(),
          message: `${name} ${mapped.suffix}`,
          source: 'docker',
          severity: mapped.severity,
        });
      } catch {
        // skip malformed lines
      }
    }
    return events;
  } catch {
    return [];
  }
}

export async function GET(): Promise<Response> {
  const events = await getDockerEvents();
  events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  return Response.json(events.slice(0, 20));
}
