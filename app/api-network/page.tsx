import { ServiceProbe } from '@/components/network/service-probe';
import { DozzleCard } from '@/components/network/dozzle-card/dozzle-card';
import { ApiHealthCard } from '@/components/api-health-card';
import { OpenPorts } from '@/components/network/open-ports';


export default function ApiNetworkPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 lg:px-6 lg:py-8">
      <header className="mb-6">
        <h1 className="font-mono text-xl font-bold tracking-tight text-foreground">
          api &amp; network
        </h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          service health, api endpoints &amp; open ports
        </p>
      </header>

      <div className="flex flex-col gap-4 xl:grid xl:grid-cols-2">
        <div className="flex flex-col gap-4">
          <ServiceProbe />
          <DozzleCard />
          <OpenPorts />
        </div>
        <div className="flex flex-col gap-4">
          <ApiHealthCard />
        </div>
      </div>
    </main>
  );
}
