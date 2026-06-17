"use client";

import { Thermometer } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useSystemDataContext } from "@/context/system-data-context";
import { HistorySparkline } from "@/components/history-sparkline";

const TEMP_MAX = 100;

function tempColor(celsius: number): string {
  if (celsius >= 80) return "text-destructive";
  if (celsius >= 60) return "text-chart-4";
  return "text-primary";
}

function tempBarClass(celsius: number): string {
  if (celsius >= 80) return "[&>div]:bg-destructive";
  if (celsius >= 60) return "[&>div]:bg-chart-4";
  return "";
}

export function CpuTemp() {
  const { hardware: data, connected } = useSystemDataContext();
  const loading = data === null;
  const error = !connected && loading ? "connecting..." : null;

  const zones = data?.cpuTemps ?? [];

  return (
    <section id="cpu-temp" className="scroll-mt-20 h-full flex flex-col">
      <div className="mb-3 flex shrink-0 items-center gap-2 font-mono text-xs text-muted-foreground">
        <Thermometer className="h-3.5 w-3.5 text-primary" />
        <span className="uppercase tracking-wider">CPU Temperature</span>
        <span className="flex-1 border-t border-border" />
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`term-dot h-1.5 w-1.5 ${error ? "bg-destructive" : "bg-primary"}`}
          />
          {!connected
            ? "reconnecting..."
            : loading
              ? "connecting..."
              : "live · ws"}
        </span>
      </div>

      <div className="panel flex-1 min-h-0 overflow-hidden p-4">
        {error && (
          <p className="font-mono text-sm text-destructive">ERR: {error}</p>
        )}

        {!error && zones.length === 0 && !loading && (
          <p className="font-mono text-sm text-muted-foreground">
            no thermal zones detected
          </p>
        )}

        {loading && zones.length === 0 && (
          <p className="font-mono text-sm text-muted-foreground">
            reading sensors...
          </p>
        )}

        <div className="space-y-4">
          {zones.map((z) => (
            <div key={z.zone} className="space-y-1.5">
              <div className="flex items-center justify-between font-mono text-sm">
                <span className="text-muted-foreground">
                  {z.type !== "unknown" ? z.type : z.zone}
                </span>
                <span
                  className={`tabular-nums font-semibold ${tempColor(z.celsius)}`}
                >
                  {z.celsius.toFixed(1)}°C
                </span>
              </div>
              <Progress
                value={(z.celsius / TEMP_MAX) * 100}
                className={`h-1.5 ${tempBarClass(z.celsius)}`}
              />
              <p className="text-right font-mono text-[10px] text-muted-foreground/40">
                / {TEMP_MAX}°C
              </p>
            </div>
          ))}
        </div>

        {zones.length > 0 && (
          <div className="mt-4 border-t border-border pt-4">
            <p className="mb-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground/60">
              avg temp · 24h
            </p>
            <HistorySparkline
              metric="tempC"
              pct={zones.reduce((s, z) => s + z.celsius, 0) / zones.length}
              maxVal={100}
              height={28}
            />
          </div>
        )}

        {data && (
          <p className="mt-4 font-mono text-[10px] text-muted-foreground/30">
            sampled {new Date(data.timestamp).toISOString().slice(11, 19)}Z
          </p>
        )}
      </div>
    </section>
  );
}
