"use client"

import { Folder as FolderIcon, Trash2 } from "lucide-react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import type { LibraryFolder } from "@/lib/library/types"

interface FolderCardProps {
  folder: LibraryFolder
  documentCount: number
  onOpen: (folder: LibraryFolder) => void
  onDelete: (id: string) => void
}

export function FolderCard({ folder, documentCount, onOpen, onDelete }: FolderCardProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <article
          className="panel rounded-lg overflow-hidden flex flex-col group cursor-pointer select-none hover:border-primary/50 transition-colors"
          onClick={() => onOpen(folder)}
          role="button"
          tabIndex={0}
          aria-label={`Open folder ${folder.name}`}
          onKeyDown={(e) => {
            if (e.key === "Enter") onOpen(folder)
          }}
        >
          <div className="relative flex flex-col items-center justify-center gap-3 bg-accent/40 group-hover:bg-accent/60 transition-colors px-4 py-7">
            <FolderIcon className="size-14 text-primary fill-primary/15" strokeWidth={1.5} />
          </div>

          <div className="px-3 py-2.5 border-t border-border bg-card">
            <p className="text-xs font-medium text-foreground leading-snug truncate" title={folder.name}>
              {folder.name}
            </p>
            <span className="text-xs text-muted-foreground">
              {documentCount} {documentCount === 1 ? "document" : "documents"}
            </span>
          </div>
        </article>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-44">
        <ContextMenuItem
          onSelect={() => onDelete(folder.id)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="size-3.5 mr-2" />
          Delete folder
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
