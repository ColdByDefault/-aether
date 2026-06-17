import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
const KNOWN_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export interface RouteInfo {
  path: string;
  methods: HttpMethod[];
  dynamic: boolean;
}

function methodsFromSource(filePath: string): HttpMethod[] {
  try {
    const src = readFileSync(filePath, 'utf-8');
    return KNOWN_METHODS.filter((m) =>
      new RegExp(`export\\s+async\\s+function\\s+${m}\\b|export\\s+function\\s+${m}\\b`).test(src),
    );
  } catch {
    return ['GET'];
  }
}

function scanApiRoutes(apiDir: string, base = '/api'): RouteInfo[] {
  const routes: RouteInfo[] = [];
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
      routes.push({
        path: base,
        methods: methodsFromSource(fullPath),
        dynamic: base.includes('['),
      });
    }
  }
  return routes;
}

// The production image only ships the `.next` build output, not the `app/`
// source tree, so filesystem scanning finds nothing there. The build's own
// route manifest is present in both dev and prod and is the reliable source.
function routesFromBuildManifest(): RouteInfo[] | null {
  const manifestPath = join(process.cwd(), '.next', 'app-path-routes-manifest.json');
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as Record<string, string>;
    // Manifest has no method info — caller falls back to source scan for methods,
    // but in prod the source isn't available, so we default to GET for static routes
    // and mark dynamic ones so the card won't auto-test them.
    return Object.entries(manifest)
      .filter(([key, value]) => key.endsWith('/route') && value.startsWith('/api'))
      .map(([, value]) => ({
        path: value,
        methods: ['GET'] as HttpMethod[],
        dynamic: value.includes('['),
      }));
  } catch {
    return null;
  }
}

export async function GET() {
  const apiDir = join(process.cwd(), 'app', 'api');
  const fromSource = scanApiRoutes(apiDir).filter((r) => r.path !== '/api/health');
  // If source scan found routes, it's dev — method info is accurate.
  // Otherwise fall back to manifest (prod) where we only know paths.
  const routes = fromSource.length > 0
    ? fromSource
    : (routesFromBuildManifest() ?? []).filter((r) => r.path !== '/api/health');
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
