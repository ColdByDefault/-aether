import { useCallback, useEffect, useState } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
export type RouteStatus = "idle" | "loading" | "ok" | "error"

export interface RouteResult {
  route: string
  method: HttpMethod
  supportedMethods: HttpMethod[]
  dynamic: boolean
  status: RouteStatus
  httpStatus?: number
  latency?: number
  error?: string
  responseBody?: unknown
  testedAt?: Date
}

export interface TestDialogData {
  route: string
  method: HttpMethod
  httpStatus?: number
  latency?: number
  error?: string
  responseBody?: unknown
  testedAt?: Date
}

export interface ApiHealthCardProps {
  healthEndpoint?: string
  autoTest?: boolean
  className?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const METHOD_COLORS: Record<HttpMethod, string> = {
  GET:    "text-emerald-600 dark:text-emerald-400",
  POST:   "text-blue-600 dark:text-blue-400",
  PUT:    "text-amber-600 dark:text-amber-400",
  PATCH:  "text-violet-600 dark:text-violet-400",
  DELETE: "text-destructive",
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useApiHealthCard(healthEndpoint: string, autoTest: boolean) {
  const [routes, setRoutes]           = useState<RouteResult[]>([])
  const [scanning, setScanning]       = useState(true)
  const [globalLoading, setGlobalLoading] = useState(false)
  const [dialogOpen, setDialogOpen]   = useState(false)
  const [dialogData, setDialogData]   = useState<TestDialogData | null>(null)
  const [open, setOpen]               = useState(false)

  useEffect(() => {
    async function discover() {
      setScanning(true)
      try {
        const res = await fetch(healthEndpoint)
        const { routes: discovered } = (await res.json()) as {
          routes: { path: string; methods: HttpMethod[]; dynamic: boolean }[]
        }
        setRoutes(
          discovered.map((r) => ({
            route: r.path,
            method: r.methods[0] ?? ("GET" as HttpMethod),
            supportedMethods: r.methods.length > 0 ? r.methods : (["GET"] as HttpMethod[]),
            dynamic: r.dynamic,
            status: "idle" as RouteStatus,
          })),
        )
      } catch {
        setRoutes([])
      } finally {
        setScanning(false)
      }
    }
    discover()
  }, [healthEndpoint])

  const testAll = useCallback(async () => {
    setGlobalLoading(true)
    await Promise.allSettled(
      routes
        .filter((r) => !r.dynamic && r.method === "GET")
        .map((r) =>
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
        setRoutes((prev) => prev.map((r) => (r.route === route ? { ...r, ...result } : r)))
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
            r.route === route ? { ...r, status: "error", error: errorMsg, testedAt: new Date() } : r,
          ),
        )
        setDialogData({ route, method, error: errorMsg, testedAt: new Date() })
        setDialogOpen(true)
      }
    },
    [healthEndpoint],
  )

  const okCount       = routes.filter((r) => r.status === "ok").length
  const errorCount    = routes.filter((r) => r.status === "error").length
  const testedCount   = okCount + errorCount
  const autoTestCount = routes.filter((r) => !r.dynamic && r.method === "GET").length

  const summary = scanning
    ? "scanning routes…"
    : routes.length === 0
      ? "no routes found"
      : testedCount > 0
        ? `${okCount} ok · ${errorCount} failed · ${routes.length - testedCount} untested`
        : `${routes.length} route${routes.length !== 1 ? "s" : ""} discovered`

  function openDialog(data: TestDialogData) {
    setDialogData(data)
    setDialogOpen(true)
  }

  return {
    routes,
    scanning,
    globalLoading,
    dialogOpen,
    dialogData,
    open,
    summary,
    autoTestCount,
    testRoute,
    testAll,
    changeMethod,
    openDialog,
    setDialogOpen,
    setOpen,
  }
}
