import type { LucideIcon } from 'lucide-react';

export function PanelHeader({ icon: Icon, label, right }: {
  icon: LucideIcon;
  label: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="panel-header">
      <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
      <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="flex-1 border-t border-border" />
      {right && <span className="shrink-0 font-mono text-xs text-muted-foreground">{right}</span>}
    </div>
  );
}
