import { FIRST_INTERVAL_DAYS, nextDateFrom } from './spaced-repetition';

export interface SolvedProblem {
  id: string;
  path: string;
  solvedAt: Date;
}

function slugify(segment: string): string {
  return segment
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/^\d+[-_.\s]+/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Identity of a problem regardless of which extension wrote it. LeetHub and
 * LeetSync commit the same solution under different folder and file namings
 * (and sometimes different problem numbers), which would otherwise queue the
 * same problem for review two or three times.
 */
export function canonicalProblemKey(path: string): string {
  const segments = path.split('/').filter(Boolean);
  const filename = segments.pop() ?? path;
  const directory = segments.pop();

  const dirKey = directory ? slugify(directory) : '';
  const fileKey = slugify(filename);

  // The directory names the problem; the filename is often generic (Solution.java).
  if (dirKey) return dirKey;
  return fileKey;
}

/** One entry per problem, keeping the copy that was solved first. */
export function dedupeSolvedProblems(problems: SolvedProblem[]): SolvedProblem[] {
  const byKey = new Map<string, SolvedProblem>();

  for (const problem of problems) {
    const key = canonicalProblemKey(problem.path);
    const existing = byKey.get(key);
    if (!existing || problem.solvedAt < existing.solvedAt) {
      byKey.set(key, problem);
    }
  }

  return [...byKey.values()];
}

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
