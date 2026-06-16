"use client"

import { useEffect, useState } from "react"
import { X, Download, ExternalLink, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { LibraryDocument } from "@/lib/library/types"

interface PdfViewerProps {
  doc: LibraryDocument | null
  onClose: () => void
}

export function PdfViewer({ doc, onClose }: PdfViewerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)

  // Close on Escape
  useEffect(() => {
    if (!doc) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [doc, onClose])

  // Fetch the PDF bytes lazily once the viewer opens for this document.
  useEffect(() => {
    if (!doc) {
      setBlobUrl(null)
      return
    }
    let url: string | null = null
    fetch(`/api/library/${doc.id}`)
      .then((res) => res.blob())
      .then((blob) => {
        url = URL.createObjectURL(blob)
        setBlobUrl(url)
      })
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [doc])

  if (!doc) return null

  const handleDownload = () => {
    if (!blobUrl) return
    const a = document.createElement("a")
    a.href = blobUrl
    a.download = doc.name
    a.click()
  }

  const handleOpenNew = () => {
    if (blobUrl) window.open(blobUrl, "_blank")
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Top bar */}
      <header className="panel-header shrink-0 border-b border-border">
        <Button
          size="sm"
          variant="ghost"
          onClick={onClose}
          aria-label="Back to library"
          className="gap-1.5"
        >
          <ArrowLeft data-icon="inline-start" />
          Library
        </Button>

        <div className="flex-1 min-w-0 px-2">
          <p className="text-sm font-medium text-foreground truncate" title={doc.name}>
            {doc.name}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownload}
            disabled={!blobUrl}
            aria-label="Download PDF"
          >
            <Download data-icon="inline-start" />
            Download
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleOpenNew}
            disabled={!blobUrl}
            aria-label="Open in new tab"
          >
            <ExternalLink data-icon="inline-start" />
            New tab
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            aria-label="Close viewer"
          >
            <X data-icon="inline-start" />
          </Button>
        </div>
      </header>

      {/* PDF iframe — takes all remaining height */}
      {blobUrl ? (
        <iframe
          src={blobUrl}
          title={doc.name}
          className="flex-1 w-full border-0"
          aria-label={`PDF viewer for ${doc.name}`}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      )}
    </div>
  )
}
