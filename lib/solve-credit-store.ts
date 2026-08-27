import { prisma } from './prisma';
import { canonicalProblemKey } from './problem-identity';
import { preferredRevision } from './revision-queue';
import { creditSolve } from './solve-credit';

export { collectSolves } from './solve-credit';

/**
 * Applies judge solves to the schedule. Keyed by problem identity rather than
 * by file path, so a re-solve credits the card the queue actually shows even
 * when the second solution landed under a different filename.
 */

const CARD_SELECT = {
  id: true,
  problemId: true,
  nextDate: true,
  lastRevised: true,
  lastSolveCredit: true,
  intervalDays: true,
  easeFactor: true,
  repetitions: true,
  lapses: true,
  createdAt: true,
  problem: { select: { path: true } },
} as const;

export async function applySolveCredits(
  userId: string,
  solvesByKey: Map<string, Date>,
): Promise<number> {
  if (solvesByKey.size === 0) return 0;

  const cards = await prisma.revision.findMany({
    where: { userId },
    select: CARD_SELECT,
  });

  const byKey = new Map<string, (typeof cards)[number]>();
  for (const card of cards) {
    const key = canonicalProblemKey(card.problem.path);
    const existing = byKey.get(key);
    // The same card the queue shows for this problem, not an arbitrary copy.
    if (!existing || preferredRevision(existing, card) !== existing) byKey.set(key, card);
  }

  const writes = [];

  for (const [key, solvedAt] of solvesByKey) {
    const card = byKey.get(key);
    if (!card) continue;

    const credit = creditSolve(card, solvedAt);
    if (!credit.credited) continue;

    writes.push(
      prisma.revision.update({
        where: { id: card.id },
        data: {
          intervalDays: credit.state.intervalDays,
          easeFactor: credit.state.easeFactor,
          repetitions: credit.state.repetitions,
          lapses: credit.state.lapses,
          nextDate: credit.nextDate,
          lastRevised: credit.lastRevised,
          lastSolveCredit: credit.lastSolveCredit,
        },
      }),
      prisma.attempt.create({
        data: {
          userId,
          problemId: card.problemId,
          rating: 'good',
          source: 'solve',
          createdAt: credit.lastRevised,
        },
      }),
    );
  }

  if (writes.length === 0) return 0;

  await prisma.$transaction(writes);
  return writes.length / 2;
}
