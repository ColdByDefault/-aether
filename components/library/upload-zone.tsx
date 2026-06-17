"use client"

import { useCallback, useRef, useState } from "react"
import { Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface UploadZoneProps {
  onFiles: (files: File[]) => void
  disabled?: boolean
}

export function UploadZone({ onFiles, disabled }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      if (disabled) return
      const accepted = Array.from(e.dataTransfer.files).filter((f) => {
        const name = f.name.toLowerCase()
        return name.endsWith(".pdf") || name.endsWith(".md")
      })
      if (accepted.length) onFiles(accepted)
    },
    [onFiles, disabled],
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
      if (files.length) onFiles(files)
      e.target.value = ""
    },
    [onFiles],
  )

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "panel rounded-lg px-4 py-3 flex items-center gap-4 transition-colors w-fit",
        dragging && "border-primary bg-accent",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf,.md,text/markdown"
        multiple
        className="sr-only"
        onChange={handleChange}
        disabled={disabled}
        aria-hidden="true"
      />

      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center size-8 rounded-md bg-accent shrink-0">
          <Upload className="size-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground leading-tight">
            Upload files
          </p>
          <p className="text-xs text-muted-foreground leading-tight">
            PDF books &amp; Markdown documents
          </p>
        </div>
      </div>

      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        aria-label="Select PDF or Markdown files to upload"
      >
        <Upload data-icon="inline-start" />
        Select files
      </Button>
    </div>
  )
}
