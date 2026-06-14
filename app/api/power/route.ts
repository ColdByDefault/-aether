import fs from 'fs/promises';
import { existsSync } from 'fs';

export interface BatteryInfo {
  name: string;
  status: string;
  capacity: number;
  capacityLevel: string;
  technology: string;
  cycleCount: number;
  voltageNow: number;
  voltageMinDesign: number;
  currentNow: number;
  chargeFull: number;
  chargeFullDesign: number;
  chargeNow: number;
  health: number;
  powerWatts: number;
  timeRemainingMinutes: number | null;
  manufacturer: string;
  model: string;
}

export interface PowerData {
  acOnline: boolean;
  batteries: BatteryInfo[];
  timestamp: string;
}

const SYS = existsSync('/host/proc') ? '/host/sys' : '/sys';
const POWER_SUPPLY = `${SYS}/class/power_supply`;

async function readField(dir: string, field: string): Promise<string> {
  try {
    return (await fs.readFile(`${dir}/${field}`, 'utf8')).trim();
  } catch {
    return '';
  }
}

async function readInt(dir: string, field: string): Promise<number> {
  const v = await readField(dir, field);
  return v ? parseInt(v, 10) : 0;
}

async function getAcOnline(): Promise<boolean> {
  let entries: string[];
  try {
    entries = await fs.readdir(POWER_SUPPLY);
  } catch {
    return false;
  }
  for (const entry of entries) {
    const type = await readField(`${POWER_SUPPLY}/${entry}`, 'type');
    if (type === 'Mains') {
      const online = await readField(`${POWER_SUPPLY}/${entry}`, 'online');
      if (online === '1') return true;
    }
  }
  return false;
}

async function readBattery(name: string): Promise<BatteryInfo | null> {
  const dir = `${POWER_SUPPLY}/${name}`;
  const type = await readField(dir, 'type');
  if (type !== 'Battery') return null;

  const [
    status,
    capacity,
    capacityLevel,
    technology,
    cycleCount,
    voltageNow,
    voltageMinDesign,
    currentNow,
    chargeFull,
    chargeFullDesign,
    chargeNow,
    manufacturer,
    model,
  ] = await Promise.all([
    readField(dir, 'status'),
    readInt(dir, 'capacity'),
    readField(dir, 'capacity_level'),
    readField(dir, 'technology'),
    readInt(dir, 'cycle_count'),
    readInt(dir, 'voltage_now'),
    readInt(dir, 'voltage_min_design'),
    readInt(dir, 'current_now'),
    readInt(dir, 'charge_full'),
    readInt(dir, 'charge_full_design'),
    readInt(dir, 'charge_now'),
    readField(dir, 'manufacturer'),
    readField(dir, 'model_name'),
  ]);

  // µV * µA → W  (÷ 1e12)
  const powerWatts = voltageNow && currentNow
    ? Math.round((voltageNow / 1e6) * (Math.abs(currentNow) / 1e6) * 10) / 10
    : 0;

  // health: how much the battery holds vs design capacity
  const health = chargeFullDesign > 0
    ? Math.round((chargeFull / chargeFullDesign) * 1000) / 10
    : 0;

  // time remaining in minutes (only meaningful while discharging/charging with non-zero current)
  let timeRemainingMinutes: number | null = null;
  if (Math.abs(currentNow) > 0) {
    if (status === 'Discharging') {
      timeRemainingMinutes = Math.round((chargeNow / Math.abs(currentNow)) * 60);
    } else if (status === 'Charging') {
      const remaining = chargeFull - chargeNow;
      timeRemainingMinutes = Math.round((remaining / Math.abs(currentNow)) * 60);
    }
  }

  return {
    name,
    status,
    capacity,
    capacityLevel,
    technology,
    cycleCount,
    voltageNow: Math.round(voltageNow / 1000) / 1000,   // µV → V
    voltageMinDesign: Math.round(voltageMinDesign / 1000) / 1000,
    currentNow: Math.round(currentNow / 1000) / 1000,    // µA → mA
    chargeFull: Math.round(chargeFull / 1000) / 1000,    // µAh → mAh
    chargeFullDesign: Math.round(chargeFullDesign / 1000) / 1000,
    chargeNow: Math.round(chargeNow / 1000) / 1000,
    health,
    powerWatts,
    timeRemainingMinutes,
    manufacturer: manufacturer.trim(),
    model: model.trim(),
  };
}

async function refresh(): Promise<PowerData> {
  let entries: string[] = [];
  try {
    entries = await fs.readdir(POWER_SUPPLY);
  } catch {
    // no power supply info available
  }

  const [acOnline, ...batteryResults] = await Promise.all([
    getAcOnline(),
    ...entries.map(e => readBattery(e)),
  ]);

  const batteries = batteryResults.filter((b): b is BatteryInfo => b !== null);

  return { acOnline: acOnline as boolean, batteries, timestamp: new Date().toISOString() };
}

let latest: PowerData | null = null;
let activeRefresh: Promise<void> | null = null;

async function doRefresh(): Promise<void> {
  if (activeRefresh) return activeRefresh;
  activeRefresh = (async () => {
    try {
      latest = await refresh();
    } catch (err) {
      console.error('Power refresh error:', err);
    } finally {
      activeRefresh = null;
    }
  })();
  return activeRefresh;
}

doRefresh();
setInterval(doRefresh, 15_000);

export async function GET(): Promise<Response> {
  if (!latest) await doRefresh();
  return latest
    ? Response.json(latest)
    : Response.json({ error: 'Not yet available' }, { status: 503 });
}
