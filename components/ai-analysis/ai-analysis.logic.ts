import { useEffect, useState } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AnalysisResult {
  analysis: string
  model: string
  timestamp: string
  nextRun: string
  auto: boolean
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export function parseObservations(text: string): string[] {
  const lines   = text.split("\n").map((l) => l.trim()).filter(Boolean)
  const bullets = lines.filter((l) => /^[-•*]/.test(l)).map((l) => l.replace(/^[-•*]\s*/, ""))
  return bullets.length > 0 ? bullets : lines
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAiAnalysis() {
  const [result, setResult]   = useState<AnalysisResult | null>(null)
  const [nextRun, setNextRun] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/analyze")
      .then((r) => r.json())
      .then((data) => {
        if (data?.nextRun)  setNextRun(data.nextRun)
        if (data?.analysis) setResult(data as AnalysisResult)
      })
      .catch(() => {})
  }, [])

  async function analyze() {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch("/api/analyze", { method: "POST" })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? "Analysis failed")
      const r = data as AnalysisResult
      setResult(r)
      if (r.nextRun) setNextRun(r.nextRun)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const observations  = result ? parseObservations(result.analysis) : []
  const nextRunLabel  = nextRun
    ? new Date(nextRun).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null

  return { result, loading, error, observations, nextRunLabel, analyze }
}
