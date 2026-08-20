import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Metric {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  tone?: string;
}

/**
 * A row of readings sharing one panel. Dividers rather than gaps, so a set of
 * figures reads as one instrument instead of competing cards.
 */
export function MetricStrip({
  metrics,
  className,
  columns = 4,
}: {
  metrics: Metric[];
  className?: string;
  columns?: 2 | 3 | 4;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 divide-y divide-border overflow-hidden rounded-[var(--radius)] border border-border bg-surface sm:divide-y-0 sm:divide-x',
        columns === 2 && 'sm:grid-cols-2',
        columns === 3 && 'sm:grid-cols-3',
        columns === 4 && 'sm:grid-cols-2 lg:grid-cols-4',
        className,
      )}
    >
      {metrics.map((metric) => (
        <div key={metric.label} className="flex flex-col gap-1 px-5 py-4">
          <span className="flex items-center gap-1.5">
            {metric.icon && (
              <metric.icon className={cn('h-3.5 w-3.5', metric.tone ?? 'text-muted-foreground')} />
            )}
            <span className="eyebrow">{metric.label}</span>
          </span>
          <span
            data-numeric
            className={cn('font-display text-3xl font-semibold leading-none', metric.tone)}
          >
            {metric.value}
          </span>
          {metric.sub && (
            <span className="text-xs text-muted-foreground">{metric.sub}</span>
          )}
        </div>
      ))}
    </div>
  );
}
