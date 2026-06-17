import { useSystemDataContext } from "@/context/system-data-context"

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

export function formatUptime(seconds: number): string {
  const days  = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins  = Math.floor((seconds % 3600) / 60)
  const parts: string[] = []
  if (days > 0)  parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  parts.push(`${mins}m`)
  return parts.join(" ")
}

export function meterColor(percent: number): string {
  if (percent >= 90) return "bg-destructive"
  if (percent >= 70) return "bg-chart-4"
  return "bg-primary"
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSystemMetrics() {
  const { metrics: data, processes: procs, connected } = useSystemDataContext()
  const loading = data === null
  const error   = !connected && loading ? "connecting..." : null
  return { data, procs, connected, loading, error }
}
