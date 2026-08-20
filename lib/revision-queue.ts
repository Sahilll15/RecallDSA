import { canonicalProblemKey, dedupeByCanonicalKey } from './problem-identity';

export interface RevisionLike {
  id: string;
  nextDate: Date | string;
  lastRevised: Date | string | null;
  repetitions: number;
  createdAt: Date | string;
  problem: { path: string };
}

function time(value: Date | string | null): number {
  if (!value) return 0;
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

/**
 * Which copy of a duplicated problem to keep. Review history is the thing that
 * cannot be recreated, so the most-reviewed card wins; ties fall to whichever
 * comes up soonest.
 */
export function preferredRevision<T extends RevisionLike>(a: T, b: T): T {
  if (a.repetitions !== b.repetitions) return a.repetitions > b.repetitions ? a : b;

  const lastA = time(a.lastRevised);
  const lastB = time(b.lastRevised);
  if (lastA !== lastB) return lastA > lastB ? a : b;

  const nextA = time(a.nextDate);
  const nextB = time(b.nextDate);
  if (nextA !== nextB) return nextA < nextB ? a : b;

  return time(a.createdAt) <= time(b.createdAt) ? a : b;
}

/** One card per problem, whatever the file layout underneath. */
export function dedupeRevisionQueue<T extends RevisionLike>(revisions: T[]): T[] {
  return dedupeByCanonicalKey(revisions, (r) => r.problem.path, preferredRevision);
}

/** The rows a cleanup should delete: every copy except the one that survives. */
export function redundantRevisions<T extends RevisionLike>(revisions: T[]): T[] {
  const keep = new Set(dedupeRevisionQueue(revisions).map((r) => r.id));
  return revisions.filter((r) => !keep.has(r.id));
}

export { canonicalProblemKey };
