'use client';

import {
  formatInterval,
  previewIntervals,
  type RecallRating,
  type SchedulingState,
} from '@/lib/spaced-repetition';
import { cn } from '@/lib/utils';

interface RatingButtonsProps {
  state: SchedulingState;
  onRate: (rating: RecallRating) => void;
  disabled?: boolean;
  className?: string;
}

const RATING_STYLES: Record<RecallRating, { label: string; classes: string }> = {
  again: {
    label: 'Again',
    classes: 'border-destructive/40 text-destructive hover:bg-destructive/10',
  },
  hard: {
    label: 'Hard',
    classes: 'border-warning/40 text-warning hover:bg-warning/10',
  },
  good: {
    label: 'Good',
    classes: 'border-primary/40 text-primary hover:bg-primary/10',
  },
  easy: {
    label: 'Easy',
    classes: 'border-info/40 text-info hover:bg-info/10',
  },
};

/** Anki-style recall rating row with the resulting interval shown per button. */
export function RatingButtons({ state, onRate, disabled, className }: RatingButtonsProps) {
  const preview = previewIntervals(state);

  return (
    <div className={cn('grid grid-cols-4 gap-2', className)}>
      {(Object.keys(RATING_STYLES) as RecallRating[]).map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => onRate(rating)}
          disabled={disabled}
          className={cn(
            'flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-md border bg-surface px-3 py-2.5 text-sm font-semibold transition-colors duration-150',
            'disabled:pointer-events-none disabled:opacity-50',
            RATING_STYLES[rating].classes,
          )}
        >
          {RATING_STYLES[rating].label}
          <span data-numeric className="font-mono text-xs font-normal text-muted-foreground">
            {formatInterval(preview[rating])}
          </span>
        </button>
      ))}
    </div>
  );
}
