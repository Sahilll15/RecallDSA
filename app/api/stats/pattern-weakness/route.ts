import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const WINDOW_DAYS = 90;

/**
 * Per-pattern struggle rate from real recall attempts, used to order the
 * trigger drill so the patterns you keep missing come up first.
 */
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const since = new Date();
    since.setDate(since.getDate() - WINDOW_DAYS);

    const attempts = await prisma.attempt.findMany({
      // Only rated recall sessions say anything about a weak pattern.
      where: { userId: session.user.id, source: 'recall', createdAt: { gte: since } },
      select: {
        rating: true,
        patternRecognized: true,
        hintsUsed: true,
        problem: { select: { pattern: true } },
      },
    });

    const tally = new Map<string, { attempts: number; struggles: number }>();

    for (const attempt of attempts) {
      const pattern = attempt.problem.pattern;
      if (!pattern) continue;

      const entry = tally.get(pattern) ?? { attempts: 0, struggles: 0 };
      entry.attempts += 1;

      const struggled =
        attempt.rating === 'again' ||
        attempt.rating === 'hard' ||
        attempt.patternRecognized === false ||
        attempt.hintsUsed > 0;
      if (struggled) entry.struggles += 1;

      tally.set(pattern, entry);
    }

    return NextResponse.json({
      windowDays: WINDOW_DAYS,
      patterns: [...tally.entries()].map(([pattern, stat]) => ({ pattern, ...stat })),
    });
  } catch (error) {
    console.error('Failed to compute pattern weakness:', error);
    return NextResponse.json({ error: 'Failed to compute weakness' }, { status: 500 });
  }
}
