"use client"

import { Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatBytes, useProcessTable } from "./process-table.logic"

export function ProcessTable() {
  const { procs, sorted, maxVal, sort, setSort, error, loading } = useProcessTable()

  return (
    <section id="processes" className="scroll-mt-20">
      <div className="mb-3 flex items-center gap-2 font-mono text-xs text-muted-foreground">
        <Cpu className="h-3.5 w-3.5 text-primary" />
        <span className="uppercase tracking-wider">Processes</span>
        <span className="flex-1 border-t border-border" />
        <span className="inline-flex items-center gap-0.5 text-muted-foreground/60">
          sort
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setSort("cpu")}
            className={`font-mono ${sort === "cpu" ? "text-primary" : "text-muted-foreground/60"}`}
          >
            cpu
          </Button>
          /
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setSort("mem")}
            className={`font-mono ${sort === "mem" ? "text-primary" : "text-muted-foreground/60"}`}
          >
            mem
          </Button>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className={`term-dot h-1.5 w-1.5 ${error ? "bg-destructive" : "bg-primary"}`} />
          {error ? "error" : loading ? "polling" : "live · 15s"}
        </span>
      </div>

      <div className="panel">
        <div className="border-b border-border px-4 py-2 font-mono text-xs text-muted-foreground/40">
          <div className="grid grid-cols-[auto_1fr_4rem_5rem_6rem_5rem] gap-3 items-center">
            <span className="w-16" />
            <span>name</span>
            <span className="text-right">pid</span>
            <span className="text-right">cpu%</span>
            <span className="text-right">rss</span>
            <span className="text-right">mem%</span>
          </div>
        </div>

        <div className="divide-y divide-border/40">
          {loading && !error && (
            <div className="px-4 py-3 font-mono text-sm text-muted-foreground">scanning processes...</div>
          )}
          {error && (
            <div className="px-4 py-3 font-mono text-sm text-destructive">ERR: {error}</div>
          )}
          {sorted.map((p) => {
            const val = sort === "cpu" ? p.cpuPercent : p.memPercent
            const barWidth = maxVal > 0 ? (val / maxVal) * 100 : 0
            return (
              <div
                key={p.pid}
                className="px-4 py-2 font-mono text-xs hover:bg-muted/30 transition-colors"
              >
                <div className="grid grid-cols-[auto_1fr_4rem_5rem_6rem_5rem] items-center gap-3">
                  <div className="relative h-0.5 w-16 overflow-hidden bg-muted/60">
                    <div
                      className="h-full bg-primary/50 transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="truncate text-foreground/80" title={p.cmdline}>
                    {p.name}
                  </span>
                  <span className="text-right tabular-nums text-muted-foreground/40">{p.pid}</span>
                  <span className="text-right tabular-nums text-foreground">{p.cpuPercent.toFixed(1)}%</span>
                  <span className="text-right tabular-nums text-muted-foreground/70">{formatBytes(p.memRss)}</span>
                  <span className="text-right tabular-nums text-muted-foreground/70">{p.memPercent.toFixed(1)}%</span>
                </div>
              </div>
            )
          })}
        </div>

        {!loading && !error && procs.length > 0 && (
          <div className="border-t border-border px-4 py-2 font-mono text-xs text-muted-foreground/30">
            {procs.length} processes · top 15 by {sort}
          </div>
        )}
      </div>
    </section>
  )
}
