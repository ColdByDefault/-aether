import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';

function scanApiRoutes(apiDir: string, base = '/api'): string[] {
  const routes: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(apiDir);
  } catch {
    return routes;
  }
  for (const entry of entries) {
    const fullPath = join(apiDir, entry);
    if (statSync(fullPath).isDirectory()) {
      routes.push(...scanApiRoutes(fullPath, `${base}/${entry}`));
    } else if (entry === 'route.ts' || entry === 'route.js') {
      routes.push(base);
    }
  }
  return routes;
}

// The production image only ships the `.next` build output, not the `app/`
// source tree, so filesystem scanning finds nothing there. The build's own
// route manifest is present in both dev and prod and is the reliable source.
function routesFromBuildManifest(): string[] | null {
  const manifestPath = join(process.cwd(), '.next', 'app-path-routes-manifest.json');
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as Record<string, string>;
    return Object.entries(manifest)
      .filter(([key, value]) => key.endsWith('/route') && value.startsWith('/api'))
      .map(([, value]) => value);
  } catch {
    return null;
  }
}

export async function GET() {
  const apiDir = join(process.cwd(), 'app', 'api');
  const routes = (routesFromBuildManifest() ?? scanApiRoutes(apiDir)).filter(
    (r) => r !== '/api/health'
  );
  return NextResponse.json({ routes });
}

export async function POST(req: NextRequest) {
  const { route, method = 'GET' } = (await req.json()) as { route: string; method?: string };

  const port = process.env.PORT ?? '3000';
  const url = `http://localhost:${port}${route}`;

  const start = Date.now();
  try {
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' } });
    const latency = Date.now() - start;
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    return NextResponse.json({
      ok: res.status >= 200 && res.status < 300,
      status: res.status,
      latency,
      body,
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      status: 0,
      latency: Date.now() - start,
      error: err instanceof Error ? err.message : 'Network error',
    });
  }
}
