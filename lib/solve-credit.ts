import { canonicalProblemKey } from './problem-identity';
import { nextDateFrom, scheduleNext, type SchedulingState } from './spaced-repetition';

/**
 * Re-solving a problem on the judge is a review, not a new solve. Without this
 * the push that records the re-solve also re-queues the card for tomorrow, and
 * a spaced schedule must never let practising something bring it back sooner.
 */

export interface CreditableRevision extends SchedulingState {
  nextDate: Date;
  lastRevised: Date | null;
  lastSolveCredit: Date | null;
}

export type SkipReason = 'already-credited' | 'reviewed-since' | 'not-due';

export type SolveCredit =
  | { credited: false; reason: SkipReason }
  | {
      credited: true;
      state: SchedulingState;
      nextDate: Date;
      lastRevised: Date;
      lastSolveCredit: Date;
    };

/** Only an in-app rating may pull a card forward; every other writer clamps to this. */
export function monotonicNextDate(existing: Date, proposed: Date): Date {
  return proposed > existing ? proposed : existing;
}

/**
 * How a solve on the judge moves an already-tracked card: as a "good" review
 * if the card was due, and not at all otherwise.
 */
export function creditSolve(
  revision: CreditableRevision,
  solvedAt: Date,
): SolveCredit {
  // Every sync re-reports the same commit dates, so credit is keyed to the
  // solve date rather than to the run that discovered it.
  if (revision.lastSolveCredit && solvedAt <= revision.lastSolveCredit) {
    return { credited: false, reason: 'already-credited' };
  }

  // Rating it in the app already advanced the ladder past this solve.
  if (revision.lastRevised && solvedAt <= revision.lastRevised) {
    return { credited: false, reason: 'reviewed-since' };
  }

  // Solving something that was not due yet is extra practice, not a review: it
  // earns no ladder progress and must leave the schedule alone.
  if (solvedAt < revision.nextDate) {
    return { credited: false, reason: 'not-due' };
  }

  const state = scheduleNext(revision, 'good');

  return {
    credited: true,
    state,
    nextDate: monotonicNextDate(
      revision.nextDate,
      nextDateFrom(state.intervalDays, solvedAt),
    ),
    lastRevised: solvedAt,
    lastSolveCredit: solvedAt,
  };
}

/** Latest solve per problem, so two files for one problem credit it once. */
export function collectSolves(
  entries: Iterable<[path: string, solvedAt: Date]>,
): Map<string, Date> {
  const byKey = new Map<string, Date>();

  for (const [path, solvedAt] of entries) {
    const key = canonicalProblemKey(path);
    const existing = byKey.get(key);
    if (!existing || solvedAt > existing) byKey.set(key, solvedAt);
  }

  return byKey;
}
