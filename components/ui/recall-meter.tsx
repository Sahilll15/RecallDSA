import { cn } from '@/lib/utils';
import { recallStrength, SEGMENTS, type StrengthTier } from '@/lib/recall-strength';

const TIER_FILL: Record<StrengthTier, string> = {
  struggling: 'bg-destructive',
  learning: 'bg-warning',
  holding: 'bg-primary',
  mastered: 'bg-primary shadow-glow-sm',
};

const TIER_TEXT: Record<StrengthTier, string> = {
  struggling: 'text-destructive',
  learning: 'text-warning',
  holding: 'text-primary',
  mastered: 'text-primary',
};

/**
 * Retention as a segmented gauge. Colour carries the tier and segment count
 * carries the interval, so the reading survives a colour-blind viewer.
 */
export function RecallMeter({
  intervalDays,
  repetitions,
  lapses,
  showLabel = true,
  className,
}: {
  intervalDays: number;
  repetitions: number;
  lapses: number;
  showLabel?: boolean;
  className?: string;
}) {
  const { tier, filled, label } = recallStrength({ intervalDays, repetitions, lapses });

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className="flex items-center gap-[3px]"
        role="img"
        aria-label={`${label}, ${filled} of ${SEGMENTS}, interval ${intervalDays} days`}
      >
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <span
            key={i}
            className={cn(
              'h-3 w-1 rounded-full',
              i < filled ? TIER_FILL[tier] : 'bg-border-strong/70',
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className={cn('font-mono text-[0.6875rem] font-medium', TIER_TEXT[tier])}>
          {label}
        </span>
      )}
    </div>
  );
}
