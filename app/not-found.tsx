import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-background text-foreground flex items-center justify-center px-4 sm:px-6 lg:px-8 antialiased">
      <div className="flex flex-col items-center justify-center max-w-md text-center space-y-8">
        {/* Icon & Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="rounded-full bg-muted p-4">
              <Compass
                className="h-12 w-12 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            404
          </h1>
          <h2 className="text-2xl font-semibold tracking-tight">
            Lost in the Aether
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            The quadrant you are looking for does not exist, has been moved, or
            is currently unavailable.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
          <Button size="lg" className="w-full sm:w-auto gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Return to Base
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
          >
            <Link href="mailto:support@aether.com">Report Issue</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
