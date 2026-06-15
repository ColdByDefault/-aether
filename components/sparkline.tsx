'use client';

import { cn } from '@/lib/utils';

interface SparklineProps {
  data: number[];
  height?: number;
  pct?: number;
  className?: string;
}

function colorClass(pct: number): string {
  if (pct >= 90) return 'text-destructive';
  if (pct >= 70) return 'text-chart-4';
  return 'text-primary';
}

export function Sparkline({ data, height = 28, pct = 0, className = '' }: SparklineProps) {
  if (data.length < 2) return null;

  const W = 200;
  const H = height;

  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - (Math.max(0, Math.min(100, v)) / 100) * H,
  }));

  const polyline = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const first = pts[0];
  const last = pts[pts.length - 1];
  const area = [
    `M${first.x.toFixed(1)},${H}`,
    ...pts.map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`),
    `L${last.x.toFixed(1)},${H}`,
    'Z',
  ].join(' ');

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      width="100%"
      height={H}
      aria-hidden="true"
      className={cn(colorClass(pct), className)}
    >
      <path d={area} fill="currentColor" fillOpacity="0.1" stroke="none" />
      <polyline
        points={polyline}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
