import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Dozzle's container name is auto-generated, so identify it by its image instead.
const DOZZLE_IMAGE = 'dozzle';

export interface DozzleStatus {
  found: boolean;
  running: boolean;
  id?: string;
  name?: string;
}

async function findDozzle(): Promise<DozzleStatus> {
  try {
    const { stdout } = await execAsync(
      `docker ps -a --format "{{.ID}}|{{.Names}}|{{.Image}}|{{.State}}" 2>/dev/null`,
    );
    const line = stdout
      .trim()
      .split('\n')
      .find((l) => l.toLowerCase().includes(DOZZLE_IMAGE));
    if (!line) return { found: false, running: false };
    const [id, name, , state] = line.split('|');
    return {
      found: true,
      running: state?.toLowerCase() === 'running',
      id: (id ?? '').slice(0, 12),
      name: name ?? '',
    };
  } catch {
    return { found: false, running: false };
  }
}

export async function GET(): Promise<Response> {
  return Response.json(await findDozzle());
}

export async function POST(request: Request): Promise<Response> {
  let action: string;
  try {
    const body = (await request.json()) as { action?: string };
    action = body.action ?? '';
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (action !== 'start' && action !== 'stop') {
    return Response.json({ error: 'action must be "start" or "stop"' }, { status: 400 });
  }

  const status = await findDozzle();
  if (!status.found || !status.id) {
    return Response.json({ error: 'Dozzle container not found' }, { status: 404 });
  }

  try {
    await execAsync(`docker ${action} ${status.id}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown';
    return Response.json({ error: `docker ${action} failed: ${msg}` }, { status: 502 });
  }

  return Response.json(await findDozzle());
}
