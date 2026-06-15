"use client"

import { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Activity, RefreshCw, Zap } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
type RouteStatus = "idle" | "loading" | "ok" | "error"

interface RouteResult {
  route: string
  method: HttpMethod
  status: RouteStatus
  httpStatus?: number
  latency?: number
  error?: string
  responseBody?: unknown
  testedAt?: Date
}

interface TestDialogData {
  route: string
  method: HttpMethod
  httpStatus?: number
  latency?: number
  error?: string
  responseBody?: unknown
  testedAt?: Date
}

const HTTP_METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"]

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET:    "text-emerald-600 dark:text-emerald-400",
  POST:   "text-blue-600 dark:text-blue-400",
  PUT:    "text-amber-600 dark:text-amber-400",
  PATCH:  "text-violet-600 dark:text-violet-400",
  DELETE: "text-destructive",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: RouteStatus }) {
  return (
    <span
      className={cn(
        "term-dot h-2 w-2 shrink-0 transition-colors",
        status === "ok"      && "bg-primary",
        status === "error"   && "bg-destructive",
        status === "loading" && "bg-amber-400 animate-pulse",
        status === "idle"    && "bg-muted-foreground/40",
      )}
      aria-hidden
    />
  )
}

function JsonViewer({ data }: { data: unknown }) {
  const formatted = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return (
    <pre className="rounded bg-muted p-4 text-xs font-mono overflow-auto max-h-[60vh] whitespace-pre-wrap break-all">
      {formatted ?? "null"}
    </pre>
  )
}

// ─── Response Dialog ──────────────────────────────────────────────────────────

function ResponseDialog({
  data,
  open,
  onOpenChange,
}: {
  data: TestDialogData | null
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  if (!data) return null
  const { route, method, httpStatus, latency, error, responseBody, testedAt } = data
  const isOk = httpStatus !== undefined && httpStatus >= 200 && httpStatus < 300

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap font-mono">
            <span className={cn("font-bold text-sm", METHOD_COLORS[method])}>{method}</span>
            <code className="text-sm text-foreground">{route}</code>
            {httpStatus !== undefined && (
              <Badge variant={isOk ? "outline" : "destructive"} className="font-mono ml-auto">
                {httpStatus === 0 ? "ERR" : httpStatus}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-3 text-xs font-mono">
            {latency !== undefined && <span>{latency}ms</span>}
            {testedAt && <span>{testedAt.toLocaleTimeString()}</span>}
            {error && <span className="text-destructive">{error}</span>}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2">
          {responseBody !== undefined && responseBody !== null ? (
            <JsonViewer data={responseBody} />
          ) : error ? (
            <div className="rounded border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm text-destructive font-mono">{error}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No response body</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Route row ────────────────────────────────────────────────────────────────

function RouteRow({
  result,
  onTest,
  onMethodChange,
  onViewResponse,
}: {
  result: RouteResult
  onTest: (route: string, method: HttpMethod) => void
  onMethodChange: (route: string, method: HttpMethod) => void
  onViewResponse: (data: TestDialogData) => void
}) {
  const { route, method, status, httpStatus, latency, error, responseBody, testedAt } = result
  const isLoading = status === "loading"
  const hasTested = status === "ok" || status === "error"

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 hover:bg-muted/40 transition-colors group">
      <StatusDot status={status} />

      <Select value={method} onValueChange={(v) => onMethodChange(route, v as HttpMethod)}>
        <SelectTrigger
          className={cn(
            "h-6 w-[78px] text-xs font-mono font-semibold border-none shadow-none px-1.5 focus:ring-0",
            METHOD_COLORS[method],
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {HTTP_METHODS.map((m) => (
            <SelectItem key={m} value={m} className={cn("text-xs font-mono font-semibold", METHOD_COLORS[m])}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <code className="flex-1 text-sm font-mono text-foreground truncate min-w-0">{route}</code>

      {latency !== undefined && (
        <span className="text-xs text-muted-foreground tabular-nums shrink-0">{latency}ms</span>
      )}

      {httpStatus !== undefined && (
        <Badge variant={status === "ok" ? "outline" : "destructive"} className="text-xs shrink-0 font-mono">
          {httpStatus === 0 ? "ERR" : httpStatus}
        </Badge>
      )}

      {error && !hasTested && (
        <Tooltip>
          <TooltipTrigger>
            <span className="text-xs text-destructive max-w-[100px] truncate cursor-help shrink-0">{error}</span>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs break-words">
            <p className="text-xs">{error}</p>
            {testedAt && <p className="text-xs text-muted-foreground mt-1">{testedAt.toLocaleTimeString()}</p>}
          </TooltipContent>
        </Tooltip>
      )}

      {hasTested && (
        <Button
          size="sm"
          variant="ghost"
          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2 shrink-0 text-xs"
          onClick={() => onViewResponse({ route, method, httpStatus, latency, error, responseBody, testedAt })}
        >
          View
        </Button>
      )}

      <Button
        size="sm"
        variant="ghost"
        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2 shrink-0"
        disabled={isLoading}
        onClick={() => onTest(route, method)}
        aria-label={`Test ${method} ${route}`}
      >
        <Zap className={cn(isLoading && "animate-spin")} />
        {isLoading ? "Testing…" : "Test"}
      </Button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ApiHealthCardProps {
  healthEndpoint?: string
  autoTest?: boolean
  className?: string
}

export function ApiHealthCard({
  healthEndpoint = "/api/health",
  autoTest = false,
  className,
}: ApiHealthCardProps) {
  const [routes, setRoutes] = useState<RouteResult[]>([])
  const [scanning, setScanning] = useState(true)
  const [globalLoading, setGlobalLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogData, setDialogData] = useState<TestDialogData | null>(null)

  useEffect(() => {
    async function discover() {
      setScanning(true)
      try {
        const res = await fetch(healthEndpoint)
        const { routes: discovered } = (await res.json()) as { routes: string[] }
        setRoutes(discovered.map((r) => ({ route: r, method: "GET" as HttpMethod, status: "idle" as RouteStatus })))
      } catch {
        setRoutes([])
      } finally {
        setScanning(false)
      }
    }
    discover()
  }, [healthEndpoint])

  useEffect(() => {
    if (autoTest && routes.length > 0 && routes.every((r) => r.status === "idle")) {
      testAll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTest, routes.length])

  const changeMethod = useCallback((route: string, method: HttpMethod) => {
    setRoutes((prev) => prev.map((r) => (r.route === route ? { ...r, method } : r)))
  }, [])

  const testRoute = useCallback(
    async (route: string, method: HttpMethod = "GET") => {
      setRoutes((prev) =>
        prev.map((r) =>
          r.route === route ? { ...r, method, status: "loading", error: undefined, responseBody: undefined } : r,
        ),
      )
      try {
        const res = await fetch(healthEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ route, method }),
        })
        const data = (await res.json()) as { ok: boolean; status: number; latency: number; error?: string; body?: unknown }
        const result: Partial<RouteResult> = {
          status: data.ok ? "ok" : "error",
          httpStatus: data.status,
          latency: data.latency,
          error: data.error,
          responseBody: data.body,
          testedAt: new Date(),
        }
        setRoutes((prev) => prev.map((r) => (r.route === route ? { ...r, ...result } : r)))
        setDialogData({ route, method, httpStatus: data.status, latency: data.latency, error: data.error, responseBody: data.body, testedAt: new Date() })
        setDialogOpen(true)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Network error"
        setRoutes((prev) =>
          prev.map((r) => (r.route === route ? { ...r, status: "error", error: errorMsg, testedAt: new Date() } : r)),
        )
        setDialogData({ route, method, error: errorMsg, testedAt: new Date() })
        setDialogOpen(true)
      }
    },
    [healthEndpoint],
  )

  const testAll = useCallback(async () => {
    setGlobalLoading(true)
    await Promise.allSettled(
      routes.map((r) =>
        fetch(healthEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ route: r.route, method: r.method }),
        })
          .then((res) => res.json())
          .then((data: { ok: boolean; status: number; latency: number; error?: string; body?: unknown }) => {
            setRoutes((prev) =>
              prev.map((p) =>
                p.route === r.route
                  ? { ...p, status: data.ok ? "ok" : "error", httpStatus: data.status, latency: data.latency, error: data.error, responseBody: data.body, testedAt: new Date() }
                  : p,
              ),
            )
          })
          .catch(() => {
            setRoutes((prev) =>
              prev.map((p) => (p.route === r.route ? { ...p, status: "error", error: "Network error", testedAt: new Date() } : p)),
            )
          }),
      ),
    )
    setGlobalLoading(false)
  }, [routes, healthEndpoint])

  const okCount     = routes.filter((r) => r.status === "ok").length
  const errorCount  = routes.filter((r) => r.status === "error").length
  const testedCount = okCount + errorCount

  const summary = scanning
    ? "scanning routes…"
    : routes.length === 0
      ? "no routes found"
      : testedCount > 0
        ? `${okCount} ok · ${errorCount} failed · ${routes.length - testedCount} untested`
        : `${routes.length} route${routes.length !== 1 ? "s" : ""} discovered`

  return (
    <>
      <div className={cn("panel flex flex-col", className)}>
        {/* Header */}
        <div className="panel-header">
          <Activity className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">API Health</span>
          <span className="flex-1 border-t border-border" />
          <span className="font-mono text-xs text-muted-foreground/70">{summary}</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs ml-1"
            disabled={scanning || globalLoading || routes.length === 0}
            onClick={testAll}
          >
            <RefreshCw className={cn("h-3 w-3", globalLoading && "animate-spin")} />
            {globalLoading ? "testing…" : "test all"}
          </Button>
        </div>

        {/* Route list */}
        <div className="flex-1 divide-y divide-border overflow-auto">
          {scanning ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-7 rounded bg-muted/60 animate-pulse" />
              ))}
            </div>
          ) : routes.length === 0 ? (
            <p className="px-4 py-6 font-mono text-sm text-muted-foreground">
              no api routes detected
            </p>
          ) : (
            routes.map((result) => (
              <RouteRow
                key={result.route}
                result={result}
                onTest={testRoute}
                onMethodChange={changeMethod}
                onViewResponse={(data) => {
                  setDialogData(data)
                  setDialogOpen(true)
                }}
              />
            ))
          )}
        </div>
      </div>

      <ResponseDialog data={dialogData} open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}
