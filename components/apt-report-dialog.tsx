'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import type { AptReport } from '@/app/api/reports/apt-updates/route';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Props {
  jobName: string;
}

export function AptReportDialog({ jobName }: Props) {
  const [report, setReport] = useState<AptReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/reports/apt-updates');
      if (res.status === 404) {
        setError('No report received yet.');
        setReport(null);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setReport(await res.json() as AptReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const statusColor =
    report?.status === 'ok'
      ? 'accent-text'
      : report?.status === 'error'
        ? 'text-destructive'
        : 'text-yellow-500';

  return (
    <Dialog onOpenChange={(open) => { if (open) fetchReport(); }}>
      <DialogTrigger className="inline-flex items-center gap-1 rounded border border-border/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/60 transition-colors hover:border-border hover:text-muted-foreground">
        <FileText className="h-3 w-3" />
        report
      </DialogTrigger>

      <DialogContent
        className="flex max-h-[80vh] max-w-2xl flex-col gap-0 p-0"
        showCloseButton={false}
      >
        <DialogHeader className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-primary" />
            <DialogTitle className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
              {jobName.toLowerCase().replace(/\s+/g, '-')}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-4">
          {loading && (
            <p className="font-mono text-sm text-muted-foreground">loading...</p>
          )}

          {error && !loading && (
            <p className="font-mono text-sm text-muted-foreground/70">{error}</p>
          )}

          {report && !loading && (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground/60">
                {report.jobId && <span>id: {report.jobId}</span>}
                <span>
                  received:{' '}
                  {new Date(report.receivedAt).toISOString().replace('T', ' ').slice(0, 19)}Z
                </span>
                {report.status && (
                  <span className={statusColor}>status: {report.status}</span>
                )}
              </div>
              <pre className="whitespace-pre-wrap wrap-break-word font-mono text-xs leading-relaxed text-foreground/85">
                {report.text}
              </pre>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
