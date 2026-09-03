import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReadinessCheck } from '@/lib/practice';

/**
 * Readiness as a checklist, never as one number. "72% ready" is not something
 * you can act on; "two more unaided solves" is, so every unmet row carries the
 * next move rather than a score.
 */
export function ReadinessChecklist({
  checks,
  className,
}: {
  checks: ReadinessCheck[];
  className?: string;
}) {
  return (
    <ul className={cn('space-y-2', className)}>
      {checks.map((check) => (
        <li key={check.id} className="flex items-start gap-2.5">
          <span
            aria-hidden
            className={cn(
              'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border',
              check.met
                ? 'border-primary/40 bg-primary-soft text-primary'
                : 'border-border-strong text-muted-foreground',
            )}
          >
            {check.met ? <Check className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
          </span>

          <div className="min-w-0 space-y-0.5">
            <p className="text-sm leading-snug">
              <span className={cn(check.met ? 'text-foreground' : 'font-medium')}>
                {check.label}
              </span>
              <span className="text-muted-foreground"> &middot; {check.detail}</span>
            </p>
            {!check.met && (
              <p className="text-xs leading-relaxed text-muted-foreground">{check.action}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Checks met, as segments. Six boxes read faster than "4/6" and survive a squint. */
export function ReadinessPips({
  met,
  total,
  className,
}: {
  met: number;
  total: number;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={`${met} of ${total} readiness checks met`}
      className={cn('flex items-center gap-[3px]', className)}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            'h-3 w-1.5 rounded-full',
            i < met
              ? met === total
                ? 'bg-primary shadow-glow-sm'
                : 'bg-primary'
              : 'bg-border-strong/70',
          )}
        />
      ))}
    </span>
  );
}
