"use client"

import { useEffect, useState } from "react"
import { X, Download, ArrowLeft, Copy, Check } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Button } from "@/components/ui/button"
import type { LibraryDocument } from "@/lib/library/types"

interface MarkdownViewerProps {
  doc: LibraryDocument | null
  onClose: () => void
}

export function MarkdownViewer({ doc, onClose }: MarkdownViewerProps) {
  const [content, setContent] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!doc) {
      setContent(null)
      return
    }
    fetch(`/api/library/${doc.id}`)
      .then((res) => res.text())
      .then(setContent)
  }, [doc])

  useEffect(() => {
    if (!doc) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [doc, onClose])

  if (!doc) return null

  const handleDownload = () => {
    if (!content) return
    const blob = new Blob([content], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = doc.name
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopy = async () => {
    if (!content) return
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
            onClick={handleCopy}
            disabled={!content}
            aria-label="Copy raw markdown"
            className="gap-1.5"
          >
            {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
            {copied ? "Copied" : "Copy raw"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownload}
            disabled={!content}
            aria-label="Download file"
          >
            <Download data-icon="inline-start" />
            Download
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

      {/* Content area */}
      <div className="flex-1 overflow-auto">
        {content === null ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Loading…
          </div>
        ) : (
          <article className="mx-auto max-w-3xl px-6 py-10 prose-md">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold text-foreground mt-0 mb-4 pb-2 border-b border-border">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-3 pb-1.5 border-b border-border/60">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-semibold text-foreground mt-6 mb-2">
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-base font-semibold text-foreground mt-4 mb-1.5">
                    {children}
                  </h4>
                ),
                h5: ({ children }) => (
                  <h5 className="text-sm font-semibold text-foreground mt-3 mb-1">
                    {children}
                  </h5>
                ),
                h6: ({ children }) => (
                  <h6 className="text-sm font-medium text-muted-foreground mt-3 mb-1">
                    {children}
                  </h6>
                ),
                p: ({ children }) => (
                  <p className="text-sm text-foreground leading-7 mb-4">{children}</p>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
                  >
                    {children}
                  </a>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-outside pl-5 mb-4 space-y-1 text-sm text-foreground">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-outside pl-5 mb-4 space-y-1 text-sm text-foreground">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="leading-7">{children}</li>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary/40 pl-4 my-4 text-sm text-muted-foreground italic">
                    {children}
                  </blockquote>
                ),
                code: ({ className, children, ...props }) => {
                  const isBlock = className?.startsWith("language-")
                  if (isBlock) {
                    const lang = className?.replace("language-", "") ?? ""
                    return (
                      <div className="relative my-4 rounded-lg overflow-hidden border border-border">
                        {lang && (
                          <div className="flex items-center justify-between px-4 py-1.5 bg-accent border-b border-border">
                            <span className="text-xs font-mono text-muted-foreground">{lang}</span>
                          </div>
                        )}
                        <pre className="overflow-x-auto p-4 bg-accent/50">
                          <code className="text-xs font-mono text-foreground leading-relaxed whitespace-pre">
                            {children}
                          </code>
                        </pre>
                      </div>
                    )
                  }
                  return (
                    <code
                      className="px-1.5 py-0.5 rounded bg-accent text-xs font-mono text-foreground"
                      {...props}
                    >
                      {children}
                    </code>
                  )
                },
                pre: ({ children }) => <>{children}</>,
                table: ({ children }) => (
                  <div className="my-4 overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm border-collapse">{children}</table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-accent/60">{children}</thead>
                ),
                th: ({ children }) => (
                  <th className="px-3 py-2 text-left text-xs font-semibold text-foreground border-b border-border">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-3 py-2 text-xs text-foreground border-b border-border/50 last-of-type:border-b-0">
                    {children}
                  </td>
                ),
                tr: ({ children }) => (
                  <tr className="hover:bg-accent/30 transition-colors">{children}</tr>
                ),
                hr: () => <hr className="my-6 border-border" />,
                img: ({ src, alt }) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt={alt ?? ""}
                    className="max-w-full rounded-lg my-4 border border-border"
                  />
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-foreground/90">{children}</em>
                ),
                del: ({ children }) => (
                  <del className="line-through text-muted-foreground">{children}</del>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </article>
        )}
      </div>
    </div>
  )
}
