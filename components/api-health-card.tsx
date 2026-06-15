"use client"

import { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { RefreshCw, Zap } from "lucide-react"

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
        "inline-block size-2 rounded-full shrink-0 transition-colors",
        status === "ok"      && "bg-emerald-500",
        status === "error"   && "bg-destructive",
        status === "loading" && "bg-amber-400 animate-pulse",
        status === "idle"    && "bg-muted-foreground/40",
      )}
      aria-hidden
    />
  )
}

function JsonViewer({ data }: { data: unknown }) {
  const formatted =
    typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return (
    <pre className="rounded-lg bg-muted p-4 text-xs font-mono overflow-auto max-h-[60vh] whitespace-pre-wrap break-all">
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
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span className={cn("font-mono font-bold text-sm", METHOD_COLORS[method])}>
              {method}
            </span>
            <code className="font-mono text-sm text-foreground">{route}</code>
            {httpStatus !== undefined && (
              <Badge
                variant={isOk ? "outline" : "destructive"}
                className="font-mono ml-auto"
              >
                {httpStatus === 0 ? "ERR" : httpStatus}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-3 text-xs">
            {latency !== undefined && (
              <span>{latency}ms</span>
            )}
            {testedAt && (
              <span>{testedAt.toLocaleTimeString()}</span>
            )}
            {error && (
              <span className="text-destructive">{error}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          {responseBody !== undefined && responseBody !== null ? (
            <JsonViewer data={responseBody} />
          ) : error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm text-destructive font-mono">{error}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              No response body
            </p>
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
    <div className="flex items-center gap-2 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors group">
      {/* status dot */}
      <StatusDot status={status} />

      {/* method selector */}
      <Select
        value={method}
        onValueChange={(v) => onMethodChange(route, v as HttpMethod)}
      >
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

      {/* route path */}
      <code className="flex-1 text-sm font-mono text-foreground truncate min-w-0">
        {route}
      </code>

      {/* latency */}
      {latency !== undefined && (
        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
          {latency}ms
        </span>
      )}

      {/* http status badge */}
      {httpStatus !== undefined && (
        <Badge
          variant={status === "ok" ? "outline" : "destructive"}
          className="text-xs shrink-0 font-mono"
        >
          {httpStatus === 0 ? "ERR" : httpStatus}
        </Badge>
      )}

      {/* error tooltip */}
      {error && !hasTested && (
        <Tooltip>
          <TooltipTrigger>
            <span className="text-xs text-destructive max-w-[100px] truncate cursor-help shrink-0">
              {error}
            </span>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs break-words">
            <p className="text-xs">{error}</p>
            {testedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                {testedAt.toLocaleTimeString()}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      )}

      {/* view response button (shown after test) */}
      {hasTested && (
        <Button
          size="sm"
          variant="ghost"
          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2 shrink-0 text-xs"
          onClick={() =>
            onViewResponse({ route, method, httpStatus, latency, error, responseBody, testedAt })
          }
        >
          View
        </Button>
      )}

      {/* test button */}
      <Button
        size="sm"
        variant="ghost"
        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2 shrink-0"
        disabled={isLoading}
        onClick={() => onTest(route, method)}
        aria-label={`Test ${method} ${route}`}
      >
        <Zap
          data-icon="inline-start"
          className={cn(isLoading && "animate-spin")}
        />
        {isLoading ? "Testing…" : "Test"}
      </Button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ApiHealthCardProps {
  /** Override the health endpoint if you host it differently */
  healthEndpoint?: string
  /** Auto-run a GET check on mount for all routes */
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

  // Discover routes
  useEffect(() => {
    async function discover() {
      setScanning(true)
      try {
        const res = await fetch(healthEndpoint)
        const { routes: discovered } = (await res.json()) as { routes: string[] }
        setRoutes(
          discovered.map((r) => ({ route: r, method: "GET" as HttpMethod, status: "idle" as RouteStatus })),
        )
      } catch {
        setRoutes([])
      } finally {
        setScanning(false)
      }
    }
    discover()
  }, [healthEndpoint])

  // Auto-test all routes once discovered
  useEffect(() => {
    if (autoTest && routes.length > 0 && routes.every((r) => r.status === "idle")) {
      testAll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTest, routes.length])

  const changeMethod = useCallback((route: string, method: HttpMethod) => {
    setRoutes((prev) =>
      prev.map((r) => (r.route === route ? { ...r, method } : r)),
    )
  }, [])

  const testRoute = useCallback(
    async (route: string, method: HttpMethod = "GET") => {
      // Mark as loading and update method
      setRoutes((prev) =>
        prev.map((r) =>
          r.route === route
            ? { ...r, method, status: "loading", error: undefined, responseBody: undefined }
            : r,
        ),
      )

      try {
        const res = await fetch(healthEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ route, method }),
        })
        const data = (await res.json()) as {
          ok: boolean
          status: number
          latency: number
          error?: string
          body?: unknown
        }

        const result: Partial<RouteResult> = {
          status: data.ok ? "ok" : "error",
          httpStatus: data.status,
          latency: data.latency,
          error: data.error,
          responseBody: data.body,
          testedAt: new Date(),
        }

        setRoutes((prev) =>
          prev.map((r) => (r.route === route ? { ...r, ...result } : r)),
        )

        // Auto-open dialog for single route tests
        setDialogData({
          route,
          method,
          httpStatus: data.status,
          latency: data.latency,
          error: data.error,
          responseBody: data.body,
          testedAt: new Date(),
        })
        setDialogOpen(true)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Network error"
        setRoutes((prev) =>
          prev.map((r) =>
            r.route === route
              ? { ...r, status: "error", error: errorMsg, testedAt: new Date() }
              : r,
          ),
        )
        setDialogData({ route, method, error: errorMsg, testedAt: new Date() })
        setDialogOpen(true)
      }
    },
    [healthEndpoint],
  )

  const testAll = useCallback(async () => {
    setGlobalLoading(true)
    // run in parallel, suppress individual dialogs
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
                  ? {
                      ...p,
                      status: data.ok ? "ok" : "error",
                      httpStatus: data.status,
                      latency: data.latency,
                      error: data.error,
                      responseBody: data.body,
                      testedAt: new Date(),
                    }
                  : p,
              ),
            )
          })
          .catch(() => {
            setRoutes((prev) =>
              prev.map((p) =>
                p.route === r.route
                  ? { ...p, status: "error", error: "Network error", testedAt: new Date() }
                  : p,
              ),
            )
          }),
      ),
    )
    setGlobalLoading(false)
  }, [routes, healthEndpoint])

  const okCount     = routes.filter((r) => r.status === "ok").length
  const errorCount  = routes.filter((r) => r.status === "error").length
  const testedCount = okCount + errorCount

  return (
    <>
      <Card className={cn("w-full max-w-xl", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base">API Health</CardTitle>
              <CardDescription className="text-sm mt-0.5">
                {scanning
                  ? "Scanning routes…"
                  : routes.length === 0
                    ? "No routes found under app/api"
                    : testedCount > 0
                      ? `${okCount} ok · ${errorCount} failed · ${routes.length - testedCount} untested`
                      : `${routes.length} route${routes.length !== 1 ? "s" : ""} discovered`}
              </CardDescription>
            </div>

            <Button
              size="sm"
              variant="outline"
              disabled={scanning || globalLoading || routes.length === 0}
              onClick={testAll}
            >
              <RefreshCw
                data-icon="inline-start"
                className={cn(globalLoading && "animate-spin")}
              />
              {globalLoading ? "Testing…" : "Test all"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {scanning ? (
            <div className="flex flex-col gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-9 rounded-lg bg-muted/60 animate-pulse" />
              ))}
            </div>
          ) : routes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No API routes detected. Make sure you have files at{" "}
              <code className="font-mono">app/api/**/route.ts</code>.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border/60">
              {routes.map((result) => (
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ResponseDialog
        data={dialogData}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  )
}
