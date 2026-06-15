import fs from 'fs/promises';

interface ThermalZone {
  zone: string;
  type: string;
  celsius: number;
}

interface SwapInfo {
  total: number;
  used: number;
  free: number;
  cached: number;
  usedPercent: number;
}

interface HardwareResponse {
  cpuTemps: ThermalZone[];
  swap: SwapInfo;
  timestamp: string;
}

async function getCpuTemps(): Promise<ThermalZone[]> {
  try {
    const basePath = '/host/sys/class/thermal';
    const entries = await fs.readdir(basePath);
    const zones = entries.filter((e) => e.startsWith('thermal_zone'));

    const results = await Promise.all(
      zones.map(async (zone) => {
        try {
          const [tempStr, typeStr] = await Promise.all([
            fs.readFile(`${basePath}/${zone}/temp`, 'utf8').catch(() => null),
            fs.readFile(`${basePath}/${zone}/type`, 'utf8').catch(() => 'unknown'),
          ]);
          if (!tempStr) return null;
          const celsius = parseInt(tempStr.trim(), 10) / 1000;
          if (isNaN(celsius) || celsius <= 0 || celsius > 125) return null;
          return {
            zone: zone.replace('thermal_zone', 'zone'),
            type: typeStr.trim(),
            celsius: Math.round(celsius * 10) / 10,
          };
        } catch {
          return null;
        }
      }),
    );

    return results.filter((z): z is ThermalZone => z !== null);
  } catch {
    return [];
  }
}

async function getSwap(): Promise<SwapInfo> {
  try {
    const data = await fs.readFile('/host/proc/meminfo', 'utf8');
    const get = (key: string) => {
      const m = data.match(new RegExp(`^${key}:\\s+(\\d+)`, 'm'));
      return m ? parseInt(m[1], 10) * 1024 : 0;
    };
    const total = get('SwapTotal');
    const free = get('SwapFree');
    const cached = get('SwapCached');
    const used = Math.max(0, total - free - cached);
    return {
      total,
      used,
      free,
      cached,
      usedPercent: total > 0 ? Math.round((used / total) * 1000) / 10 : 0,
    };
  } catch {
    return { total: 0, used: 0, free: 0, cached: 0, usedPercent: 0 };
  }
}

let latest: HardwareResponse | null = null;
let activeRefresh: Promise<void> | null = null;

async function refresh(): Promise<void> {
  if (activeRefresh) return activeRefresh;
  activeRefresh = (async () => {
    try {
      const [cpuTemps, swap] = await Promise.all([getCpuTemps(), getSwap()]);
      latest = { cpuTemps, swap, timestamp: new Date().toISOString() };
    } catch (err) {
      console.error('Hardware refresh error:', err);
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
    : Response.json({ error: 'Hardware data not yet available' }, { status: 503 });
}
