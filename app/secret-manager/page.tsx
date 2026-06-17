import { SecretsManager } from '@/components/secret-manager/SecretsManager';


export default function SecretManagerPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 lg:px-6 lg:py-8">
      <header className="mb-6">
        <h1 className="font-mono text-xl font-bold tracking-tight text-foreground">
          secrets
        </h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          aes-256-gcm encrypted · stored locally · never leaves your device
        </p>
      </header>
      <SecretsManager />
    </main>
  );
}
