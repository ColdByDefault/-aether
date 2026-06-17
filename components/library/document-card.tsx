"use client"

import { useRef, type MouseEvent } from "react"
import { FileText, FileCode2, BookOpen, Star, EyeOff, Eye, Trash2, Check, Folder as FolderIcon, FolderMinus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { cn } from "@/lib/utils"
import type { LibraryDocument, LibraryFolder } from "@/lib/library/types"

interface DocumentCardProps {
  doc: LibraryDocument
  folders: LibraryFolder[]
  onOpen: (doc: LibraryDocument) => void
  onDelete: (id: string) => void
  onToggleStar: (id: string) => void
  onToggleHide: (id: string) => void
  onMoveToFolder: (id: string, folderId: string | null) => void
  selected: boolean
  selectionActive: boolean
  onToggleSelect: (id: string) => void
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
  folders,
  onOpen,
  onDelete,
  onToggleStar,
  onToggleHide,
  onMoveToFolder,
  selected,
  selectionActive,
  onToggleSelect,
}: DocumentCardProps) {
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMarkdown = doc.name.toLowerCase().endsWith(".md")
  const isPdf = doc.name.toLowerCase().endsWith(".pdf")

  const handleClick = (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || selectionActive) {
      onToggleSelect(doc.id)
      return
    }
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
            selected && "ring-2 ring-primary border-primary/50",
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
            {/* Selection checkbox */}
            <button
              type="button"
              role="checkbox"
              aria-checked={selected}
              aria-label={selected ? `Deselect ${doc.name}` : `Select ${doc.name}`}
              onClick={(e) => {
                e.stopPropagation()
                onToggleSelect(doc.id)
              }}
              className={cn(
                "absolute top-2 left-2 flex items-center justify-center size-4.5 rounded-sm border transition-colors",
                selected
                  ? "bg-primary border-primary text-primary-foreground"
                  : cn(
                      "bg-card/80 border-border opacity-0 group-hover:opacity-100",
                      selectionActive && "opacity-100",
                    ),
              )}
            >
              {selected && <Check className="size-3" />}
            </button>

            {/* Stacked paper effect */}
            <div className="relative size-14">
              <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded bg-border" />
              <div className="absolute inset-0 translate-x-0.5 translate-y-0.5 rounded bg-muted" />
              <div className="relative flex items-center justify-center size-14 rounded bg-card border border-border shadow-sm">
                {isMarkdown
                  ? <FileCode2 className="size-6 text-blue-500" />
                  : <FileText className="size-6 text-primary" />}
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
              <div className="absolute bottom-2 left-2">
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
              {doc.name.replace(/\.(pdf|md)$/i, "")}
            </p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {isPdf && (
                <Badge className="text-xs font-semibold px-1.5 py-0 bg-rose-500/15 text-rose-600 border-rose-500/30 dark:text-rose-400 hover:bg-rose-500/15">
                  PDF
                </Badge>
              )}
              {isMarkdown && (
                <Badge className="text-xs font-semibold px-1.5 py-0 bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400 hover:bg-blue-500/15">
                  MD
                </Badge>
              )}
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
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <FolderIcon className="size-3.5 mr-2" />
            Move to folder
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-44">
            {doc.folderId && (
              <>
                <ContextMenuItem onSelect={() => onMoveToFolder(doc.id, null)}>
                  <FolderMinus className="size-3.5 mr-2" />
                  Remove from folder
                </ContextMenuItem>
                {folders.length > 0 && <ContextMenuSeparator />}
              </>
            )}
            {folders.length === 0 ? (
              <ContextMenuItem disabled>No folders yet</ContextMenuItem>
            ) : (
              folders
                .filter((f) => f.id !== doc.folderId)
                .map((f) => (
                  <ContextMenuItem key={f.id} onSelect={() => onMoveToFolder(doc.id, f.id)}>
                    <FolderIcon className="size-3.5 mr-2" />
                    {f.name}
                  </ContextMenuItem>
                ))
            )}
          </ContextMenuSubContent>
        </ContextMenuSub>
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
