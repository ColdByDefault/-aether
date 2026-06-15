export interface AptReport {
  jobName: string;
  jobId?: string;
  timestamp: string;
  text: string;
  status?: 'ok' | 'warning' | 'error';
  receivedAt: string;
}

let latest: AptReport | null = null;

const API_KEY = process.env.REPORTS_API_KEY;

export async function GET(): Promise<Response> {
  if (!latest) {
    return Response.json({ error: 'No report received yet' }, { status: 404 });
  }
  return Response.json(latest);
}

export async function POST(request: Request): Promise<Response> {
  if (API_KEY) {
    const auth = request.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${API_KEY}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const contentType = request.headers.get('content-type') ?? '';
  let report: AptReport;

  try {
    if (contentType.includes('application/json')) {
      const json = await request.json() as Record<string, string>;
      if (!json.text) {
        return Response.json({ error: 'Missing required field: text' }, { status: 400 });
      }
      report = {
        jobName: json.jobName ?? 'apt-updates',
        jobId: json.jobId,
        timestamp: json.timestamp ?? new Date().toISOString(),
        text: json.text,
        status: (json.status as AptReport['status']) ?? undefined,
        receivedAt: new Date().toISOString(),
      };
    } else {
      const text = await request.text();
      if (!text.trim()) {
        return Response.json({ error: 'Empty request body' }, { status: 400 });
      }
      report = {
        jobName: 'apt-updates',
        timestamp: new Date().toISOString(),
        text: text.trim(),
        receivedAt: new Date().toISOString(),
      };
    }
  } catch {
    return Response.json({ error: 'Failed to parse request body' }, { status: 400 });
  }

  latest = report;
  return Response.json({ ok: true, receivedAt: report.receivedAt });
}
