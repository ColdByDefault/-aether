import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface DiskInfo {
  total: number;
  used: number;
  available: number;
  usedPercent: number;
  mount: string;
}

interface MetricsResponse {
  cpu: {
    usedPercent: number;
    cores: number;
    model: string;
    loadAvg: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usedPercent: number;
  };
  disk: DiskInfo[];
  uptime: number;
  hostname: string;
  platform: string;
  timestamp: string;
}

function cpuSnapshot(): { idle: number; total: number } {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;
  for (const cpu of cpus) {
    for (const type of Object.keys(cpu.times) as (keyof typeof cpu.times)[]) {
      total += cpu.times[type];
    }
    idle += cpu.times.idle;
  }
  return { idle, total };
}

async function getCpuUsage(): Promise<number> {
  const start = cpuSnapshot();
  await new Promise((resolve) => setTimeout(resolve, 200));
  const end = cpuSnapshot();
  const idleDiff = end.idle - start.idle;
  const totalDiff = end.total - start.total;
  if (totalDiff === 0) return 0;
  return Math.max(0, Math.min(100, Math.round((100 - (idleDiff / totalDiff) * 100) * 10) / 10));
}

async function getDiskInfo(): Promise<DiskInfo[]> {
  try {
    const { stdout } = await execAsync(
      "df -Pk -x tmpfs -x devtmpfs -x squashfs -x overlay 2>/dev/null || df -Pk"
    );
    const lines = stdout.trim().split('\n').slice(1);
    const disks: DiskInfo[] = [];
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 6) continue;
      const total = parseInt(parts[1], 10) * 1024;
      const used = parseInt(parts[2], 10) * 1024;
      const available = parseInt(parts[3], 10) * 1024;
      const mount = parts[5];
      if (total === 0) continue;
      disks.push({ total, used, available, usedPercent: Math.round((used / total) * 1000) / 10, mount });
    }
    return disks.sort((a, b) => b.total - a.total).slice(0, 4);
  } catch {
    return [];
  }
}

// Background refresh — computes once every 15s, requests always read from memory.
let latest: MetricsResponse | null = null;
let activeRefresh: Promise<void> | null = null;

async function refresh(): Promise<void> {
  if (activeRefresh) return activeRefresh;
  activeRefresh = (async () => {
    try {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const [cpuUsage, disk] = await Promise.all([getCpuUsage(), getDiskInfo()]);
      latest = {
        cpu: {
          usedPercent: cpuUsage,
          cores: os.cpus().length,
          model: os.cpus()[0]?.model?.trim() ?? 'Unknown',
          loadAvg: os.loadavg().map((n) => Math.round(n * 100) / 100),
        },
        memory: { total: totalMem, used: usedMem, free: freeMem, usedPercent: Math.round((usedMem / totalMem) * 1000) / 10 },
        disk,
        uptime: os.uptime(),
        hostname: process.env.SERVER_HOSTNAME || os.hostname(),
        platform: `${os.type()} ${os.release()}`,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      console.error('Metrics refresh error:', err);
    } finally {
      activeRefresh = null;
    }
  })();
  return activeRefresh;
}

refresh();
setInterval(refresh, 15_000);

export async function GET(): Promise<Response> {
  if (!latest) await refresh();
  return latest
    ? Response.json(latest)
    : Response.json({ error: 'Metrics not yet available' }, { status: 503 });
}
