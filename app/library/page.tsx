import type { Metadata } from "next"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { LibraryShell } from "@/components/library/library-shell"

export const metadata: Metadata = {
  title: "Library",
  description: "Upload and read your PDF books and articles.",
}

export default function LibraryPage() {
  return (
    <TooltipProvider>
      <main className="min-h-screen bg-background">
        <div className="px-6 py-8">
          <header className="mb-8">
            <h1 className="text-2xl font-semibold text-foreground text-balance">
              Library
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload PDF books and articles, then read them directly in the
              browser.
            </p>
          </header>
          <LibraryShell />
        </div>
      </main>
      <Toaster />
    </TooltipProvider>
  )
}
