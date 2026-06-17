import { useState } from "react"
import type { AptReport } from "@/app/api/reports/apt-updates/route"

export function useAptReportDialog() {
  const [report, setReport] = useState<AptReport | null>(null)
  const [error, setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function fetchReport() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/reports/apt-updates")
      if (res.status === 404) {
        setError("No report received yet.")
        setReport(null)
        return
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setReport((await res.json()) as AptReport)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report")
    } finally {
      setLoading(false)
    }
  }

  const statusColor =
    report?.status === "ok"
      ? "accent-text"
      : report?.status === "error"
        ? "text-destructive"
        : "text-yellow-500"

  return { report, error, loading, statusColor, fetchReport }
}
