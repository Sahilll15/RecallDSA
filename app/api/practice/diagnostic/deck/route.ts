import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { blindfold, buildDeck, DECK_SIZE, ITEM_SECONDS, type RecognitionStat } from '@/lib/diagnostic';
import { contaminatedSlugs } from '@/lib/practice-store';

/**
 * A fresh blind deck. The answers stay on the server: the client is sent
 * statements only, and POST /api/practice/diagnostic grades the run from the
 * catalog when it comes back.
 */
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    const [exclude, attempts, diagnostics] = await Promise.all([
      contaminatedSlugs(userId),
      prisma.practiceAttempt.findMany({ where: { userId }, select: { rungId: true } }),
      prisma.diagnosticItem.groupBy({
        by: ['pattern'],
        where: { userId },
        _count: { _all: true },
        _sum: { seconds: true },
      }),
    ]);

    // groupBy cannot count a boolean column, so accuracy is a second read.
    const correctRows = await prisma.diagnosticItem.groupBy({
      by: ['pattern'],
      where: { userId, correct: true },
      _count: { _all: true },
    });
    const correctByPattern = new Map(
      correctRows.map((row) => [row.pattern, row._count._all]),
    );

    const recognition = new Map<string, RecognitionStat>(
      diagnostics.map((row) => [
        row.pattern,
        { seen: row._count._all, correct: correctByPattern.get(row.pattern) ?? 0 },
      ]),
    );

    const deck = buildDeck({
      exclude,
      recognition,
      touchedRungIds: new Set(attempts.map((a) => a.rungId)),
      size: DECK_SIZE,
    });

    return NextResponse.json({
      runId: randomUUID(),
      secondsPerItem: ITEM_SECONDS,
      items: blindfold(deck),
    });
  } catch (error) {
    console.error('Failed to build diagnostic deck:', error);
    return NextResponse.json({ error: 'Failed to build deck' }, { status: 500 });
  }
}
