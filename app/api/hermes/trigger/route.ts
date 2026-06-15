import http from 'http';

function httpGet(
  url: string,
  timeoutMs: number,
  headers?: Record<string, string>,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: timeoutMs, headers }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function getSessionToken(): Promise<string> {
  const host = 'host.docker.internal';
  const port = process.env.HERMES_PORT ?? '9119';
  const { body: html } = await httpGet(`http://${host}:${port}/`, 5000);
  const match = html.match(/__HERMES_SESSION_TOKEN__="([^"]+)"/);
  if (!match) throw new Error('Session token not found in Hermes page');
  return match[1];
}

export async function POST(request: Request): Promise<Response> {
  let jobId: string;
  try {
    const body = await request.json() as { jobId?: string };
    if (!body.jobId) return Response.json({ error: 'Missing jobId' }, { status: 400 });
    jobId = body.jobId;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const host = 'host.docker.internal';
  const port = process.env.HERMES_PORT ?? '9119';

  let token: string;
  try {
    token = await getSessionToken();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown';
    return Response.json({ error: `Could not reach Hermes: ${msg}` }, { status: 502 });
  }

  try {
    const res = await fetch(
      `http://${host}:${port}/api/cron/jobs/${jobId}/trigger?profile=default`,
      {
        method: 'POST',
        headers: { 'x-hermes-session-token': token },
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      return Response.json(
        { error: `Hermes ${res.status}: ${text.slice(0, 200)}` },
        { status: 502 },
      );
    }

    return Response.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown';
    return Response.json({ error: `Trigger failed: ${msg}` }, { status: 502 });
  }
}
