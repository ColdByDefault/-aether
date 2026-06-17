import { useEffect, useState } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProcessEntry {
  pid: number
  name: string
  cmdline: string
  cpuPercent: number
  memRss: number
  memPercent: number
}

export type SortKey = "cpu" | "mem"

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProcessTable() {
  const [procs, setProcs]     = useState<ProcessEntry[]>([])
  const [sort, setSort]       = useState<SortKey>("cpu")
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const poll = async () => {
      try {
        const res = await fetch("/api/processes")
        if (!res.ok) throw new Error("fetch failed")
        const data: unknown = await res.json()
        if (!active) return
        if (Array.isArray(data)) setProcs(data as ProcessEntry[])
        setError(null)
        setLoading(false)
      } catch (e) {
        if (!active) return
        setError(e instanceof Error ? e.message : "error")
        setLoading(false)
      }
    }

    poll()
    const interval = setInterval(poll, 15_000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  const sorted = [...procs]
    .sort((a, b) => (sort === "cpu" ? b.cpuPercent - a.cpuPercent : b.memPercent - a.memPercent))
    .slice(0, 15)

  const maxVal = sorted[0] ? (sort === "cpu" ? sorted[0].cpuPercent : sorted[0].memPercent) : 1

  return { procs, sorted, maxVal, sort, setSort, error, loading }
}
