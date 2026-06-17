import { SystemMetrics } from '@/components/system-metrics';
import { CpuTemp } from '@/components/system-metrics/cpu-temp';
import { SwapUsage } from '@/components/system-metrics/swap-usage';
import { PowerMetrics } from '@/components/power-metrics';


export default function SystemPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 lg:px-6 lg:py-8">
      <header className="mb-6">
        <h1 className="font-mono text-xl font-bold tracking-tight text-foreground">
          system
        </h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          hardware metrics, temperature &amp; power
        </p>
      </header>

      <div className="flex flex-col gap-4 xl:grid xl:grid-cols-2">
        <div className="flex flex-col gap-4">
          <SystemMetrics />
          <CpuTemp />
        </div>
        <div className="flex flex-col gap-4">
          <SwapUsage />
          <PowerMetrics />
        </div>
      </div>
    </main>
  );
}
