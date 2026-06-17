"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { BookOpen, ChevronRight, EyeOff, FolderPlus, Search, Star, Trash2, X } from "lucide-react"
import { useLibrary } from "@/lib/library/use-library"
import { UploadZone } from "./upload-zone"
import { DocumentCard } from "./document-card"
import { FolderCard } from "./folder-card"
import { PdfViewer } from "./pdf-viewer"
import { MarkdownViewer } from "./markdown-viewer"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { cn } from "@/lib/utils"
import { mapWithConcurrency } from "@/lib/library/concurrency"
import type { LibraryDocument, LibraryFolder } from "@/lib/library/types"

type FilterMode = "all" | "starred" | "hidden"
const UPLOAD_CONCURRENCY = 4

export function LibraryShell() {
  const {
    documents,
    folders,
    isLoading,
    addDocument,
    removeDocument,
    removeDocuments,
    toggleStar,
    toggleHidden,
    moveDocuments,
    addFolder,
    removeFolder,
  } = useLibrary()
  const [activeDoc, setActiveDoc] = useState<LibraryDocument | null>(null)
  const [uploading, setUploading] = useState(false)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<FilterMode>("all")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [folderDialogOpen, setFolderDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")

  useEffect(() => {
    if (filter !== "all") setCurrentFolderId(null)
  }, [filter])

  const inFolderView = filter === "all"
  const currentFolder = folders.find((f) => f.id === currentFolderId) ?? null

  const scopedDocuments = inFolderView
    ? documents.filter(
        (d) =>
          !d.hidden && (currentFolderId === null ? d.folderId === null : d.folderId === currentFolderId),
      )
    : documents.filter((d) => (filter === "starred" ? d.starred && !d.hidden : d.hidden))

  const filtered = scopedDocuments.filter((d) =>
    d.name.toLowerCase().includes(query.toLowerCase()),
  )

  const visibleFolders =
    inFolderView && currentFolderId === null
      ? folders.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()))
      : []

  const uploadOne = async (file: File): Promise<{ name: string; error?: string }> => {
    try {
      const res = await fetch("/api/library/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size }),
      })
      const data = await res.json()
      if (!res.ok) return { name: file.name, error: data.error ?? "Upload failed" }

      await addDocument(file, currentFolderId)
      return { name: file.name }
    } catch {
      return { name: file.name, error: "Upload failed" }
    }
  }

  const handleFiles = async (files: File[]) => {
    setUploading(true)

    if (files.length === 1) {
      const result = await uploadOne(files[0])
      if (result.error) toast.error(result.error)
      else toast.success(`"${result.name}" added to library`)
      setUploading(false)
      return
    }

    const loadingToast = toast.loading(`Uploading ${files.length} files...`)
    const results = await mapWithConcurrency(files, UPLOAD_CONCURRENCY, uploadOne)
    setUploading(false)
    toast.dismiss(loadingToast)

    const failed = results.filter((r) => r.error)
    const succeeded = results.length - failed.length

    if (succeeded > 0) {
      toast.success(`${succeeded} file${succeeded === 1 ? "" : "s"} added to library`)
    }
    if (failed.length > 0) {
      toast.error(
        `${failed.length} file${failed.length === 1 ? "" : "s"} failed to upload`,
        { description: failed.map((f) => f.name).slice(0, 3).join(", ") + (failed.length > 3 ? "…" : "") },
      )
    }
  }

  const handleDelete = (id: string) => {
    const doc = documents.find((d) => d.id === id)
    removeDocument(id)
    if (activeDoc?.id === id) setActiveDoc(null)
    setSelectedIds((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    toast.success(`"${doc?.name}" removed`)
  }

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    await removeDocuments(ids)
    if (activeDoc && selectedIds.has(activeDoc.id)) setActiveDoc(null)
    clearSelection()
    toast.success(`${ids.length} document${ids.length === 1 ? "" : "s"} removed`)
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

  const handleMoveToFolder = (id: string, folderId: string | null) => {
    const doc = documents.find((d) => d.id === id)
    const folder = folders.find((f) => f.id === folderId)
    moveDocuments([id], folderId)
    toast.success(
      folder ? `Moved "${doc?.name}" to "${folder.name}"` : `Removed "${doc?.name}" from folder`,
    )
  }

  const handleBulkMove = (folderId: string | null) => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    const folder = folders.find((f) => f.id === folderId)
    moveDocuments(ids, folderId)
    clearSelection()
    toast.success(
      folder
        ? `Moved ${ids.length} document${ids.length === 1 ? "" : "s"} to "${folder.name}"`
        : `Removed ${ids.length} document${ids.length === 1 ? "" : "s"} from folder`,
    )
  }

  const handleOpenFolder = (folder: LibraryFolder) => {
    setCurrentFolderId(folder.id)
    clearSelection()
  }

  const handleDeleteFolder = (id: string) => {
    const folder = folders.find((f) => f.id === id)
    removeFolder(id)
    if (currentFolderId === id) setCurrentFolderId(null)
    toast.success(`"${folder?.name}" deleted. Its documents are now unfiled.`)
  }

  const handleCreateFolder = async () => {
    const name = newFolderName.trim()
    if (!name) return
    try {
      await addFolder(name)
      toast.success(`Folder "${name}" created`)
      setNewFolderName("")
      setFolderDialogOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create folder")
    }
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
          : currentFolder
            ? "This folder is empty."
            : "No documents yet. Upload a PDF or Markdown file to get started."

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Top bar: upload + search */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <UploadZone onFiles={handleFiles} disabled={uploading} />

          <div className="flex items-center gap-2">
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
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => setFolderDialogOpen(true)}
            >
              <FolderPlus className="size-3.5" />
              New folder
            </Button>
          </div>
        </div>

        {/* Breadcrumb */}
        {inFolderView && currentFolder && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <button
              className="hover:text-foreground transition-colors"
              onClick={() => setCurrentFolderId(null)}
            >
              All documents
            </button>
            <ChevronRight className="size-3" />
            <span className="text-foreground font-medium">{currentFolder.name}</span>
          </div>
        )}

        {/* Bulk selection bar */}
        {selectedIds.size > 0 && (
          <div className="panel rounded-md px-3 py-2 flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {selectedIds.size} selected
            </span>
            <div className="flex items-center gap-1.5">
              <Select
                onValueChange={(value) => handleBulkMove(value === "none" ? null : (value as string))}
              >
                <SelectTrigger size="sm" className="h-7 text-xs">
                  <SelectValue placeholder="Move to folder..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unfiled</SelectItem>
                  {folders.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="h-7 px-2.5 text-xs gap-1.5"
              >
                <X className="size-3.5" />
                Clear
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkDelete}
                className="h-7 px-2.5 text-xs gap-1.5 text-destructive hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            </div>
          </div>
        )}

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
        ) : filtered.length === 0 && visibleFolders.length === 0 ? (
          <div className="panel rounded-lg p-12 flex flex-col items-center gap-2 text-center">
            <BookOpen className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {visibleFolders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                documentCount={documents.filter((d) => d.folderId === folder.id && !d.hidden).length}
                onOpen={handleOpenFolder}
                onDelete={handleDeleteFolder}
              />
            ))}
            {filtered.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                folders={folders}
                onOpen={setActiveDoc}
                onDelete={handleDelete}
                onToggleStar={handleToggleStar}
                onToggleHide={handleToggleHide}
                onMoveToFolder={handleMoveToFolder}
                selected={selectedIds.has(doc.id)}
                selectionActive={selectedIds.size > 0}
                onToggleSelect={handleToggleSelect}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
          </DialogHeader>
          <input
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateFolder()
            }}
            placeholder="Folder name"
            className="panel rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground bg-transparent focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setFolderDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateFolder}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PdfViewer
        doc={activeDoc?.name.toLowerCase().endsWith(".pdf") ? activeDoc : null}
        onClose={() => setActiveDoc(null)}
      />
      <MarkdownViewer
        doc={activeDoc?.name.toLowerCase().endsWith(".md") ? activeDoc : null}
        onClose={() => setActiveDoc(null)}
      />
    </>
  )
}
