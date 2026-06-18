import { AiAnalysis } from '@/components/ai-analysis';
import { EventFeed } from '@/components/logs/event-feed';


export default function LogsPage() {
  return (
    <main className="min-h-screen bg-transparent px-4 py-6 lg:px-6 lg:py-8">
      <header className="mb-6">
        <h1 className="font-mono text-xl font-bold tracking-tight text-foreground">
          logs
        </h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          ai health analysis &amp; recent system events
        </p>
      </header>

      <div className="flex flex-col gap-4 xl:grid xl:grid-cols-2">
        <AiAnalysis />
        <EventFeed />
      </div>
    </main>
  );
}
