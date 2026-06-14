import fs from 'fs/promises';
import { existsSync } from 'fs';

export interface ProcessEntry {
  pid: number;
  name: string;
  cmdline: string;
  cpuPercent: number;
  memRss: number;
  memPercent: number;
}

interface ProcSnapshot {
  totalTicks: number;
  procs: Map<number, number>;
}

// /host/proc is the host filesystem mount used in the Docker Compose setup.
// Fall back to /proc when running outside Docker (e.g. dev container).
const HOST_PROC = existsSync('/host/proc') ? '/host/proc' : '/proc';

async function getTotalMemKb(): Promise<number> {
  try {
    const data = await fs.readFile(`${HOST_PROC}/meminfo`, 'utf8');
    const m = data.match(/^MemTotal:\s+(\d+)/m);
    return m ? parseInt(m[1], 10) : 0;
  } catch {
    return 0;
  }
}

async function getTotalCpuTicks(): Promise<number> {
  try {
    const data = await fs.readFile(`${HOST_PROC}/stat`, 'utf8');
    const line = data.split('\n')[0];
    return line.trim().split(/\s+/).slice(1).reduce((a, b) => a + parseInt(b, 10), 0);
  } catch {
    return 0;
  }
}

async function readAllProcs(): Promise<Map<number, { ticks: number; name: string; vmRssKb: number; cmdline: string }>> {
  const map = new Map<number, { ticks: number; name: string; vmRssKb: number; cmdline: string }>();

  let entries: string[];
  try {
    entries = await fs.readdir(HOST_PROC);
  } catch {
    return map;
  }

  const pids = entries.filter(e => /^\d+$/.test(e)).map(Number);

  await Promise.all(pids.map(async pid => {
    try {
      const [statusRaw, statRaw, cmdlineRaw] = await Promise.all([
        fs.readFile(`${HOST_PROC}/${pid}/status`, 'utf8').catch(() => ''),
        fs.readFile(`${HOST_PROC}/${pid}/stat`, 'utf8').catch(() => ''),
        fs.readFile(`${HOST_PROC}/${pid}/cmdline`, 'utf8').catch(() => ''),
      ]);

      const name = statusRaw.match(/^Name:\s+(.+)/m)?.[1]?.trim() ?? '';
      const vmRssKb = parseInt(statusRaw.match(/^VmRSS:\s+(\d+)/m)?.[1] ?? '0', 10);

      // /proc/<pid>/stat: "pid (comm) state ppid pgrp ... utime stime ..."
      // Find last ')' to safely skip comm (which may contain spaces/parens)
      const parenEnd = statRaw.lastIndexOf(')');
      if (parenEnd < 0) return;
      const rest = statRaw.slice(parenEnd + 2).trim().split(/\s+/);
      // rest[0]=state rest[1]=ppid ... rest[11]=utime rest[12]=stime
      const utime = parseInt(rest[11], 10) || 0;
      const stime = parseInt(rest[12], 10) || 0;

      const cmdline = cmdlineRaw.split('\0').filter(Boolean).slice(0, 3).join(' ').trim() || name;

      map.set(pid, { ticks: utime + stime, name, vmRssKb, cmdline });
    } catch {
      // process exited or inaccessible
    }
  }));

  return map;
}

let prevSnapshot: ProcSnapshot | null = null;
let latestProcs: ProcessEntry[] | null = null;
let activeRefresh: Promise<void> | null = null;

async function refresh(): Promise<void> {
  if (activeRefresh) return activeRefresh;
  activeRefresh = (async () => {
    try {
      const [totalMemKb, totalTicks, procs] = await Promise.all([
        getTotalMemKb(),
        getTotalCpuTicks(),
        readAllProcs(),
      ]);

      const entries: ProcessEntry[] = [];

      for (const [pid, proc] of procs) {
        let cpuPercent = 0;
        if (prevSnapshot && prevSnapshot.procs.has(pid)) {
          const prevTicks = prevSnapshot.procs.get(pid)!;
          const tickDiff = proc.ticks - prevTicks;
          const totalDiff = totalTicks - prevSnapshot.totalTicks;
          if (totalDiff > 0) {
            cpuPercent = Math.round((tickDiff / totalDiff) * 1000) / 10;
          }
        }

        entries.push({
          pid,
          name: proc.name,
          cmdline: proc.cmdline,
          cpuPercent: Math.max(0, cpuPercent),
          memRss: proc.vmRssKb * 1024,
          memPercent: totalMemKb > 0 ? Math.round((proc.vmRssKb / totalMemKb) * 1000) / 10 : 0,
        });
      }

      const procTickMap = new Map<number, number>();
      for (const [pid, proc] of procs) procTickMap.set(pid, proc.ticks);
      prevSnapshot = { totalTicks, procs: procTickMap };

      latestProcs = entries;
    } catch (err) {
      console.error('Process refresh error:', err);
    } finally {
      activeRefresh = null;
    }
  })();
  return activeRefresh;
}

refresh();
setInterval(refresh, 15_000);

export async function GET(): Promise<Response> {
  if (!latestProcs) await refresh();
  return latestProcs
    ? Response.json(latestProcs)
    : Response.json({ error: 'Not yet available' }, { status: 503 });
}
