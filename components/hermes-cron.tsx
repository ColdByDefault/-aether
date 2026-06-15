'use client';

import { Clock } from 'lucide-react';
import { PanelHeader } from '@/components/panel-header';
import { HermesTriggerButton } from '@/components/hermes-trigger-button';
import { AptReportDialog } from '@/components/apt-report-dialog';
import { useSystemDataContext } from '@/context/system-data-context';

export function HermesCron() {
  const { status: data } = useSystemDataContext();

  if ((data?.cronJobs?.length ?? 0) === 0) return null;

  return (
    <div className="panel">
      <PanelHeader
        icon={Clock}
        label="Hermes Cron"
        right={`${data!.cronJobs.filter((j) => j.enabled).length}/${data!.cronJobs.length} active`}
      />
      <div className="divide-y divide-border">
        {data!.cronJobs.map((job) => {
          const failed = job.enabled && job.state === 'failed';
          const ok = job.enabled && !failed;
          const nextLabel = job.nextRun
            ? new Date(job.nextRun).toISOString().slice(5, 16).replace('T', ' ')
            : null;
          const statusLabel = !job.enabled ? 'disabled' : failed ? 'err' : job.state;

          return (
            <div key={job.id} className="px-4 py-3 font-mono text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`term-dot h-2 w-2 shrink-0 ${ok ? 'bg-primary' : failed ? 'bg-destructive' : 'bg-muted-foreground/40'}`}
                  />
                  <span className="text-foreground">{job.name.toLowerCase().replace(/\s+/g, '-')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={ok ? 'accent-text' : failed ? 'text-destructive' : 'text-muted-foreground/50'}>
                    {statusLabel}
                  </span>
                  <HermesTriggerButton jobId={job.id} />
                  <AptReportDialog jobName={job.name} />
                </div>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 pl-5 text-xs text-muted-foreground/60">
                {job.schedule && <span>{job.schedule}</span>}
                {nextLabel && <span>next {nextLabel}</span>}
                {job.lastStatus && (
                  <span>
                    last{' '}
                    <span className={job.lastStatus === 'success' ? 'accent-text' : 'text-destructive'}>
                      {job.lastStatus}
                    </span>
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 pl-5 text-xs text-muted-foreground/45">
                {job.noAgent && (
                  <span className="border border-muted-foreground/25 px-1 text-muted-foreground/50">no-agent</span>
                )}
                {job.script && <span>script: {job.script}</span>}
                {job.model && (
                  <span className={job.noAgent ? 'line-through opacity-40' : ''}>
                    model: {job.model}{job.provider ? ` (${job.provider})` : ''}
                  </span>
                )}
              </div>
              {job.lastError && (
                <div className="mt-1 truncate pl-5 text-xs text-destructive/80">{job.lastError}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
