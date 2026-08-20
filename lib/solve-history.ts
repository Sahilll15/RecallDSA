import { FIRST_INTERVAL_DAYS, nextDateFrom } from './spaced-repetition';
import { canonicalProblemKey, dedupeByCanonicalKey } from './problem-identity';

export interface SolvedProblem {
  id: string;
  path: string;
  solvedAt: Date;
}

/** One entry per problem, keeping the copy that was solved first. */
export function dedupeSolvedProblems(problems: SolvedProblem[]): SolvedProblem[] {
  return dedupeByCanonicalKey(problems, (p) => p.path, (a, b) =>
    b.solvedAt < a.solvedAt ? b : a,
  );
}

export { canonicalProblemKey };

/**
 * First review lands a day after the solve. A solve older than that is simply
 * due now: replaying the ladder would assume reviews that never happened, and
 * anchoring to the solve keeps the oldest work at the front of the queue.
 */
export function scheduleFromSolveDate(solvedAt: Date): {
  nextDate: Date;
  intervalDays: number;
} {
  return {
    nextDate: nextDateFrom(FIRST_INTERVAL_DAYS, solvedAt),
    intervalDays: FIRST_INTERVAL_DAYS,
  };
}
