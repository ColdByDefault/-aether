"use client";

import { Inter } from "next/font/google";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";

// Assuming you use Inter. Adjust if Aether uses a different primary font.
const inter = Inter({ subsets: ["latin"] });

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} min-h-dvh bg-transparent text-foreground flex items-center justify-center antialiased p-4 sm:p-6`}
      >
        <div className="pointer-events-none fixed inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/bg2.png')" }}
          />
          <div className="absolute inset-0 bg-background/70" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center max-w-md text-center space-y-8">
          {/* Icon & Status */}
          <div className="space-y-4 flex flex-col items-center">
            <div className="rounded-full bg-destructive/10 p-4 w-fit">
              <AlertTriangle
                className="h-12 w-12 text-destructive"
                aria-hidden="true"
              />
            </div>
            <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
              System Failure
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              A critical error occurred within the Aether infrastructure. Our
              systems have logged the incident.
            </p>
          </div>

          {/* Technical Digest (Optional: Helpful for debugging) */}
          {error.digest && (
            <div className="bg-muted p-3 rounded-md w-full text-left border border-border">
              <p className="text-xs text-muted-foreground font-mono truncate">
                Error ID: {error.digest}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex w-full justify-center">
            <Button
              onClick={() => reset()}
              size="lg"
              className="w-full sm:w-auto gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Restart Process
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
