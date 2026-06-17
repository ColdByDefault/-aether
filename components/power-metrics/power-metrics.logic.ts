import { useSystemDataContext } from "@/context/system-data-context"

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export function meterColor(percent: number): string {
  if (percent <= 10) return "bg-destructive"
  if (percent <= 25) return "bg-chart-4"
  return "bg-primary"
}

export function healthColor(percent: number): string {
  if (percent < 60) return "bg-destructive"
  if (percent < 80) return "bg-chart-4"
  return "bg-primary"
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function statusLabel(status: string, acOnline: boolean): { text: string; dot: string } {
  const s = status.toLowerCase()
  if (s === "full")          return { text: "full",                                    dot: "bg-primary" }
  if (s === "charging")      return { text: "charging",                                dot: "bg-chart-4" }
  if (s === "discharging")   return { text: "on battery",                              dot: "bg-destructive" }
  if (s === "not charging")  return { text: acOnline ? "plugged in" : "not charging",  dot: "bg-primary" }
  return { text: s, dot: "bg-muted-foreground" }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePowerMetrics() {
  const { power: data, connected } = useSystemDataContext()
  const loading     = data === null
  const error       = !connected && loading ? "connecting..." : null
  const hasBatteries = data ? data.batteries.length > 0 : false
  return { data, connected, loading, error, hasBatteries }
}
