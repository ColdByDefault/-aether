'use client';

import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

interface BatteryInfo {
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

interface PowerData {
  acOnline: boolean;
  batteries: BatteryInfo[];
  timestamp: string;
}

function meterColor(percent: number): string {
  if (percent <= 10) return 'bg-destructive';
  if (percent <= 25) return 'bg-chart-4';
  return 'bg-primary';
}

function healthColor(percent: number): string {
  if (percent < 60) return 'bg-destructive';
  if (percent < 80) return 'bg-chart-4';
  return 'bg-primary';
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline gap-3 font-mono text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className="flex-1 border-b border-dashed border-border/60" />
      <span className={accent ? 'accent-text' : 'text-foreground'}>{v}</span>
    </div>
  );
}

function statusLabel(status: string, acOnline: boolean): { text: string; dot: string } {
  const s = status.toLowerCase();
  if (s === 'full') return { text: 'full', dot: 'bg-primary' };
  if (s === 'charging') return { text: 'charging', dot: 'bg-chart-4' };
  if (s === 'discharging') return { text: 'on battery', dot: 'bg-destructive' };
  if (s === 'not charging') return { text: acOnline ? 'plugged in' : 'not charging', dot: 'bg-primary' };
  return { text: s, dot: 'bg-muted-foreground' };
}

function BatteryCard({ bat, acOnline }: { bat: BatteryInfo; acOnline: boolean }) {
  const { text: statusText, dot: statusDot } = statusLabel(bat.status, acOnline);

  return (
    <div className="space-y-4">
      {/* Capacity bar */}
      <div className="font-mono text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">capacity</span>
          <span className="text-foreground tabular-nums">{bat.capacity}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden bg-muted">
          <div
            className={`h-full transition-all duration-500 ${meterColor(bat.capacity)}`}
            style={{ width: `${bat.capacity}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center gap-2 font-mono text-xs text-muted-foreground/70">
          <span className={`term-dot h-1.5 w-1.5 ${statusDot}`} />
          <span>{statusText}</span>
          {bat.timeRemainingMinutes !== null && (
            <span>· {formatTime(bat.timeRemainingMinutes)} remaining</span>
          )}
        </div>
      </div>

      {/* Health bar */}
      <div className="font-mono text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">health</span>
          <span className="text-foreground tabular-nums">{bat.health.toFixed(1)}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden bg-muted">
          <div
            className={`h-full transition-all duration-500 ${healthColor(bat.health)}`}
            style={{ width: `${Math.min(100, bat.health)}%` }}
          />
        </div>
        <p className="mt-1.5 font-mono text-xs text-muted-foreground/70">
          {bat.chargeFull.toFixed(0)} mAh / {bat.chargeFullDesign.toFixed(0)} mAh design · {bat.cycleCount} cycles
        </p>
      </div>

      {/* Stats grid */}
      <div className="space-y-2 pt-1">
        <Row k="ac power" v={acOnline ? 'connected' : 'disconnected'} accent={acOnline} />
        {bat.powerWatts > 0 && (
          <Row k="draw" v={`${bat.powerWatts.toFixed(1)} W`} />
        )}
        <Row k="voltage" v={`${bat.voltageNow.toFixed(3)} V`} />
        {bat.currentNow !== 0 && (
          <Row k="current" v={`${Math.abs(bat.currentNow).toFixed(0)} mA`} />
        )}
        <Row k="technology" v={bat.technology} />
        <Row
          k="model"
          v={bat.manufacturer ? `${bat.manufacturer} ${bat.model}`.trim() : bat.model}
        />
      </div>
    </div>
  );
}

export function PowerMetrics() {
  const [data, setData] = useState<PowerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchPower = async () => {
      try {
        const res = await fetch('/api/power');
        if (!res.ok) throw new Error('Failed to fetch power data');
        const result = await res.json();
        if (!active) return;
        setData(result);
        setError(null);
        setLoading(false);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    fetchPower();
    const interval = setInterval(fetchPower, 15_000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  const hasBatteries = data && data.batteries.length > 0;

  return (
    <section id="power" className="scroll-mt-20">
      <div className="mb-3 flex items-center gap-2 font-mono text-xs text-muted-foreground">
        <Zap className="h-3.5 w-3.5 text-primary" />
        <span className="uppercase tracking-wider">Power</span>
        <span className="flex-1 border-t border-border" />
        <span className="inline-flex items-center gap-1.5">
          <span className={`term-dot h-1.5 w-1.5 ${error ? 'bg-destructive' : 'bg-primary'}`} />
          {error ? 'error' : loading ? 'polling' : 'live · 15s'}
        </span>
      </div>

      <div className="panel">
        {error && (
          <div className="px-4 py-2.5 font-mono text-sm text-destructive">ERR: {error}</div>
        )}

        {loading && !error && (
          <div className="px-4 py-4 font-mono text-sm text-muted-foreground">reading power supply...</div>
        )}

        {!loading && !error && !hasBatteries && (
          <div className="px-4 py-4 font-mono text-sm text-muted-foreground">
            no battery detected · ac power {data?.acOnline ? 'connected' : 'disconnected'}
          </div>
        )}

        {hasBatteries && (
          <div className={`grid grid-cols-1 divide-y divide-border ${data.batteries.length > 1 ? 'md:grid-cols-2 md:divide-x md:divide-y-0' : ''}`}>
            {data.batteries.map((bat) => (
              <div key={bat.name} className="p-4">
                {data.batteries.length > 1 && (
                  <p className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    {bat.name.toLowerCase()}
                  </p>
                )}
                <BatteryCard bat={bat} acOnline={data.acOnline} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
