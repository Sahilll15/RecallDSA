export type RecallRating = 'again' | 'hard' | 'good' | 'easy';

export interface SchedulingState {
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  lapses: number;
}

export const FIRST_INTERVAL_DAYS = 1;
export const MIN_EASE = 1.3;
export const MAX_EASE = 3.0;
export const MAX_INTERVAL_DAYS = 180;
export const MASTERY_INTERVAL_DAYS = 30;

// Intervals for the first "good" reviews after the initial 1-day review.
const LADDER = [3, 7];

export const RATING_LABELS: Record<RecallRating, string> = {
  again: 'Again',
  hard: 'Hard',
  good: 'Good',
  easy: 'Easy',
};

export function isRecallRating(value: unknown): value is RecallRating {
  return value === 'again' || value === 'hard' || value === 'good' || value === 'easy';
}

export function initialSchedulingState(): SchedulingState {
  return {
    intervalDays: FIRST_INTERVAL_DAYS,
    easeFactor: 2.5,
    repetitions: 0,
    lapses: 0,
  };
}

function clampEase(ease: number): number {
  return Math.min(MAX_EASE, Math.max(MIN_EASE, ease));
}

function clampInterval(days: number): number {
  return Math.min(MAX_INTERVAL_DAYS, Math.max(1, Math.round(days)));
}

/** SM-2 adapted to day granularity: a 1/3/7-day ladder, then interval * ease. */
export function scheduleNext(state: SchedulingState, rating: RecallRating): SchedulingState {
  const { intervalDays, easeFactor, repetitions, lapses } = state;

  switch (rating) {
    case 'again':
      return {
        intervalDays: 1,
        easeFactor: clampEase(easeFactor - 0.2),
        repetitions: 0,
        lapses: lapses + 1,
      };
    case 'hard':
      return {
        intervalDays: clampInterval(Math.max(intervalDays + 1, intervalDays * 1.2)),
        easeFactor: clampEase(easeFactor - 0.15),
        repetitions: repetitions + 1,
        lapses,
      };
    case 'good':
      return {
        intervalDays: clampInterval(
          repetitions < LADDER.length ? LADDER[repetitions] : intervalDays * easeFactor,
        ),
        easeFactor,
        repetitions: repetitions + 1,
        lapses,
      };
    case 'easy': {
      const goodInterval =
        repetitions < LADDER.length ? LADDER[repetitions] : intervalDays * easeFactor;
      return {
        intervalDays: clampInterval(goodInterval * 1.4),
        easeFactor: clampEase(easeFactor + 0.15),
        repetitions: repetitions + 1,
        lapses,
      };
    }
  }
}

export function previewIntervals(state: SchedulingState): Record<RecallRating, number> {
  return {
    again: scheduleNext(state, 'again').intervalDays,
    hard: scheduleNext(state, 'hard').intervalDays,
    good: scheduleNext(state, 'good').intervalDays,
    easy: scheduleNext(state, 'easy').intervalDays,
  };
}

export function nextDateFrom(intervalDays: number, from: Date = new Date()): Date {
  return new Date(from.getTime() + intervalDays * 24 * 60 * 60 * 1000);
}

export function formatInterval(days: number): string {
  if (days < 30) return `${days}d`;
  const months = days / 30;
  return `${months % 1 === 0 ? months : months.toFixed(1)}mo`;
}
