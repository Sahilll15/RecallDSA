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
    classes:
      'border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/10 focus-visible:ring-red-500',
  },
  hard: {
    label: 'Hard',
    classes:
      'border-orange-500/40 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 focus-visible:ring-orange-500',
  },
  good: {
    label: 'Good',
    classes:
      'border-primary/40 text-primary hover:bg-primary/10 focus-visible:ring-primary',
  },
  easy: {
    label: 'Easy',
    classes:
      'border-green-500/40 text-green-600 dark:text-green-400 hover:bg-green-500/10 focus-visible:ring-green-500',
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
            'flex flex-col items-center gap-0.5 rounded-lg border-2 bg-background px-3 py-2.5 text-sm font-semibold transition-all duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
            'disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
            RATING_STYLES[rating].classes,
          )}
        >
          {RATING_STYLES[rating].label}
          <span className="text-xs font-normal text-muted-foreground">
            {formatInterval(preview[rating])}
          </span>
        </button>
      ))}
    </div>
  );
}
