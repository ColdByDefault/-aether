"use client"

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
import { Activity, ChevronDown, RefreshCw, Zap } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  type ApiHealthCardProps,
  type HttpMethod,
  type RouteResult,
  type RouteStatus,
  type TestDialogData,
  METHOD_COLORS,
  useApiHealthCard,
} from "./api-health-card.logic"

// ─── Atoms ────────────────────────────────────────────────────────────────────

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

// ─── Route Row ────────────────────────────────────────────────────────────────

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
  const { route, method, supportedMethods, dynamic, status, httpStatus, latency, error, responseBody, testedAt } = result
  const isLoading   = status === "loading"
  const hasTested   = status === "ok" || status === "error"
  const canAutoTest = method === "GET" && !dynamic

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
          {supportedMethods.map((m) => (
            <SelectItem key={m} value={m} className={cn("text-xs font-mono font-semibold", METHOD_COLORS[m])}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <code className="flex-1 text-sm font-mono text-foreground truncate min-w-0">{route}</code>

      {dynamic && (
        <Badge variant="outline" className="text-xs shrink-0 font-mono text-muted-foreground">dynamic</Badge>
      )}

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

      <Tooltip>
        <TooltipTrigger>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2"
              disabled={isLoading || !canAutoTest}
              onClick={() => onTest(route, method)}
              aria-label={`Test ${method} ${route}`}
            >
              <Zap className={cn(isLoading && "animate-spin")} />
              {isLoading ? "Testing…" : "Test"}
            </Button>
          </span>
        </TooltipTrigger>
        {!canAutoTest && (
          <TooltipContent side="left" className="max-w-xs">
            <p className="text-xs">
              {dynamic
                ? "Needs a real ID — can't auto-test dynamic routes."
                : "Needs a request body — can't auto-test write routes."}
            </p>
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ApiHealthCard({
  healthEndpoint = "/api/health",
  autoTest = false,
  className,
}: ApiHealthCardProps) {
  const {
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
  } = useApiHealthCard(healthEndpoint, autoTest)

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen} className={cn("panel flex flex-col", className)}>
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
            {globalLoading ? "testing…" : `test all${autoTestCount < routes.length ? ` (${autoTestCount})` : ""}`}
          </Button>
          <CollapsibleTrigger className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer">
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
          </CollapsibleTrigger>
        </div>

        {/* Route list */}
        <CollapsibleContent>
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
                  onViewResponse={openDialog}
                />
              ))
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <ResponseDialog data={dialogData} open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}
