import { MASTERY_INTERVAL_DAYS } from './spaced-repetition';

export type StrengthTier = 'struggling' | 'learning' | 'holding' | 'mastered';

export interface RecallStrength {
  tier: StrengthTier;
  /** Filled segments out of `SEGMENTS`. */
  filled: number;
  label: string;
}

export const SEGMENTS = 6;

/** Interval thresholds each segment represents, in days. */
const LADDER = [1, 3, 7, 14, 21, MASTERY_INTERVAL_DAYS];

export const TIER_LABELS: Record<StrengthTier, string> = {
  struggling: 'Struggling',
  learning: 'Learning',
  holding: 'Holding',
  mastered: 'Mastered',
};

/**
 * How well a problem is holding, as segments on a gauge. Interval length is the
 * signal; a lapse on a still-short interval overrides it, because a card that
 * keeps collapsing back to one day is not merely early.
 */
export function recallStrength(input: {
  intervalDays: number;
  repetitions: number;
  lapses: number;
}): RecallStrength {
  const { intervalDays, repetitions, lapses } = input;

  const filled = Math.max(
    1,
    LADDER.filter((threshold) => intervalDays >= threshold).length,
  );

  const tier: StrengthTier =
    lapses > 0 && intervalDays <= LADDER[1]
      ? 'struggling'
      : intervalDays >= MASTERY_INTERVAL_DAYS
        ? 'mastered'
        : repetitions >= 2 && intervalDays >= LADDER[2]
          ? 'holding'
          : 'learning';

  return { tier, filled: Math.min(filled, SEGMENTS), label: TIER_LABELS[tier] };
}
