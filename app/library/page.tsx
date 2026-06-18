import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { LibraryShell } from "@/components/library/library-shell"


export default function LibraryPage() {
  return (
    <TooltipProvider>
      <main className="min-h-screen bg-transparent">
        <div className="px-6 py-8">
          <header className="mb-8">
            <h1 className="text-2xl font-semibold text-foreground text-balance">
              Library
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload PDF books, articles, and Markdown documents — read them
              directly in the browser.
            </p>
          </header>
          <LibraryShell />
        </div>
      </main>
      <Toaster />
    </TooltipProvider>
  )
}
