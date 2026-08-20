import type { Prisma } from '@prisma/client';
import { prisma } from './prisma';

/**
 * A Problem cascades to its Revision, RecallNote, Attempts and Mistakes.
 * Deleting one that carries any of those destroys review history that cannot
 * be recreated, so every deletion path in the app must run through here
 * rather than re-implementing this check.
 */

const HISTORY_SELECT = {
  id: true,
  _count: { select: { revisions: true, attempts: true, mistakes: true } },
  recallNote: { select: { id: true } },
} as const;

type ProblemWithHistoryCounts = {
  id: string;
  _count: { revisions: number; attempts: number; mistakes: number };
  recallNote: { id: string } | null;
};

export function carriesHistory(problem: ProblemWithHistoryCounts): boolean {
  return (
    problem._count.revisions > 0 ||
    problem._count.attempts > 0 ||
    problem._count.mistakes > 0 ||
    problem.recallNote !== null
  );
}

/** Deletes only the given problems that carry zero history; returns how many of each. */
export async function deleteHistorylessProblems(
  where: Prisma.ProblemWhereInput,
): Promise<{ removed: number; keptWithHistory: number }> {
  const candidates = await prisma.problem.findMany({ where, select: HISTORY_SELECT });
  const disposable = candidates.filter((p) => !carriesHistory(p));

  const { count: removed } = await prisma.problem.deleteMany({
    where: { id: { in: disposable.map((p) => p.id) } },
  });

  return { removed, keptWithHistory: candidates.length - disposable.length };
}

/** Whether every problem under a repo is free of history, i.e. the repo is safe to delete. */
export async function repoHasNoHistory(repoId: string): Promise<boolean> {
  const problems = await prisma.problem.findMany({
    where: { repoId },
    select: HISTORY_SELECT,
  });
  return !problems.some(carriesHistory);
}
