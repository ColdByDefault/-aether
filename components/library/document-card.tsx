"use client"

import { useRef } from "react"
import { FileText, BookOpen, Star, EyeOff, Eye, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { cn } from "@/lib/utils"
import type { LibraryDocument } from "@/lib/library/types"

interface DocumentCardProps {
  doc: LibraryDocument
  onOpen: (doc: LibraryDocument) => void
  onDelete: (id: string) => void
  onToggleStar: (id: string) => void
  onToggleHide: (id: string) => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function DocumentCard({
  doc,
  onOpen,
  onDelete,
  onToggleStar,
  onToggleHide,
}: DocumentCardProps) {
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleClick = () => {
    if (clickTimer.current) {
      // Double-click — clear single click and do nothing (context menu handles actions)
      clearTimeout(clickTimer.current)
      clickTimer.current = null
      return
    }
    clickTimer.current = setTimeout(() => {
      clickTimer.current = null
      onOpen(doc)
    }, 220)
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <article
          className={cn(
            "panel rounded-lg overflow-hidden flex flex-col group cursor-pointer select-none",
            "hover:border-primary/50 transition-colors",
            doc.hidden && "opacity-50",
          )}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          aria-label={`Open ${doc.name}`}
          onKeyDown={(e) => {
            if (e.key === "Enter") onOpen(doc)
          }}
        >
          {/* Thumbnail area */}
          <div className="relative flex flex-col items-center justify-center gap-3 bg-accent/40 group-hover:bg-accent/60 transition-colors px-4 py-7">
            {/* Stacked paper effect */}
            <div className="relative size-14">
              <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded bg-border" />
              <div className="absolute inset-0 translate-x-0.5 translate-y-0.5 rounded bg-muted" />
              <div className="relative flex items-center justify-center size-14 rounded bg-card border border-border shadow-sm">
                <FileText className="size-6 text-primary" />
              </div>
            </div>

            {/* Star badge — always visible when starred */}
            {doc.starred && (
              <div className="absolute top-2 right-2">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
              </div>
            )}

            {/* Hidden indicator */}
            {doc.hidden && (
              <div className="absolute top-2 left-2">
                <EyeOff className="size-3.5 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2.5 border-t border-border bg-card">
            <p
              className="text-xs font-medium text-foreground leading-snug truncate"
              title={doc.name}
            >
              {doc.name.replace(/\.pdf$/i, "")}
            </p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <Badge
                variant="secondary"
                className="text-xs font-normal px-1.5 py-0"
              >
                {formatBytes(doc.size)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDate(doc.uploadedAt)}
              </span>
            </div>
          </div>
        </article>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-44">
        <ContextMenuItem onSelect={() => onOpen(doc)}>
          <BookOpen className="size-3.5 mr-2" />
          Open
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => onToggleStar(doc.id)}>
          <Star className="size-3.5 mr-2" />
          {doc.starred ? "Unstar" : "Star"}
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => onToggleHide(doc.id)}>
          {doc.hidden ? (
            <>
              <Eye className="size-3.5 mr-2" />
              Unhide
            </>
          ) : (
            <>
              <EyeOff className="size-3.5 mr-2" />
              Hide
            </>
          )}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onSelect={() => onDelete(doc.id)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="size-3.5 mr-2" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
