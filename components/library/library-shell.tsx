"use client"

import { useState } from "react"
import { toast } from "sonner"
import { BookOpen, Search, Star, EyeOff } from "lucide-react"
import { useLibrary } from "@/lib/library/use-library"
import { UploadZone } from "./upload-zone"
import { DocumentCard } from "./document-card"
import { PdfViewer } from "./pdf-viewer"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { LibraryDocument } from "@/lib/library/types"

type FilterMode = "all" | "starred" | "hidden"

export function LibraryShell() {
  const { documents, isLoading, addDocument, removeDocument, toggleStar, toggleHidden } =
    useLibrary()
  const [activeDoc, setActiveDoc] = useState<LibraryDocument | null>(null)
  const [uploading, setUploading] = useState(false)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<FilterMode>("all")

  const filtered = documents.filter((d) => {
    const matchesQuery = d.name.toLowerCase().includes(query.toLowerCase())
    if (filter === "starred") return matchesQuery && d.starred && !d.hidden
    if (filter === "hidden") return matchesQuery && d.hidden
    return matchesQuery && !d.hidden
  })

  const handleFiles = async (files: File[]) => {
    setUploading(true)
    for (const file of files) {
      try {
        const res = await fetch("/api/library/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: file.name, size: file.size }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error ?? "Upload failed")
          continue
        }
        await addDocument(file)
        toast.success(`"${file.name}" added to library`)
      } catch {
        toast.error(`Failed to upload "${file.name}"`)
      }
    }
    setUploading(false)
  }

  const handleDelete = (id: string) => {
    const doc = documents.find((d) => d.id === id)
    removeDocument(id)
    if (activeDoc?.id === id) setActiveDoc(null)
    toast.success(`"${doc?.name}" removed`)
  }

  const handleToggleHide = (id: string) => {
    const doc = documents.find((d) => d.id === id)
    if (!doc) return
    toggleHidden(id)
    if (activeDoc?.id === id) setActiveDoc(null)
    toast.success(doc.hidden ? `"${doc.name}" is now visible` : `"${doc.name}" hidden`)
  }

  const handleToggleStar = (id: string) => {
    const doc = documents.find((d) => d.id === id)
    if (!doc) return
    toggleStar(id)
    toast.success(doc.starred ? `Removed star from "${doc.name}"` : `Starred "${doc.name}"`)
  }

  const visibleCount = documents.filter((d) => !d.hidden).length
  const hiddenCount = documents.filter((d) => d.hidden).length
  const starredCount = documents.filter((d) => d.starred && !d.hidden).length

  const emptyMessage =
    filter === "starred"
      ? "No starred documents yet. Right-click a file to star it."
      : filter === "hidden"
        ? "No hidden documents."
        : query
          ? "No documents match your search."
          : "No documents yet. Upload a PDF to get started."

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Top bar: upload + search */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <UploadZone onFiles={handleFiles} disabled={uploading} />

          {documents.length > 0 && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="search"
                placeholder="Search files..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="panel rounded-md pl-7 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground bg-transparent focus:outline-none focus:ring-2 focus:ring-ring w-52"
                aria-label="Search documents"
              />
            </div>
          )}
        </div>

        {/* Filter tabs */}
        {documents.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilter("all")}
              className={cn(
                "h-7 px-3 text-xs gap-1.5",
                filter === "all" && "bg-accent text-foreground",
              )}
            >
              All
              <span className="tabular-nums text-muted-foreground">{visibleCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilter("starred")}
              className={cn(
                "h-7 px-3 text-xs gap-1.5",
                filter === "starred" && "bg-accent text-foreground",
              )}
            >
              <Star className="size-3" />
              Starred
              <span className="tabular-nums text-muted-foreground">{starredCount}</span>
            </Button>
            {hiddenCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilter("hidden")}
                className={cn(
                  "h-7 px-3 text-xs gap-1.5",
                  filter === "hidden" && "bg-accent text-foreground",
                )}
              >
                <EyeOff className="size-3" />
                Hidden
                <span className="tabular-nums text-muted-foreground">{hiddenCount}</span>
              </Button>
            )}
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="panel rounded-lg p-12 flex flex-col items-center gap-2 text-center">
            <BookOpen className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                onOpen={setActiveDoc}
                onDelete={handleDelete}
                onToggleStar={handleToggleStar}
                onToggleHide={handleToggleHide}
              />
            ))}
          </div>
        )}
      </div>

      <PdfViewer doc={activeDoc} onClose={() => setActiveDoc(null)} />
    </>
  )
}
