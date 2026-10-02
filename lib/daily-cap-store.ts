import { prisma } from './prisma';
import { spreadBacklog, type SpreadOptions } from './daily-cap';

/** Applies `spreadBacklog` to a user's queue and returns how many cards moved. */
export async function rebalanceQueue(userId: string, options: SpreadOptions = {}): Promise<number> {
  const cards = await prisma.revision.findMany({
    where: { userId },
    select: { id: true, nextDate: true, intervalDays: true, lapses: true },
  });

  const moves = spreadBacklog(cards, options);
  if (moves.length === 0) return 0;

  await prisma.$transaction(
    moves.map((m) =>
      prisma.revision.update({ where: { id: m.id }, data: { nextDate: m.nextDate } }),
    ),
  );
  return moves.length;
}
