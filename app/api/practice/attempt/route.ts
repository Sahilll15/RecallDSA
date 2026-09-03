import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ladderProblem } from '@/lib/pattern-ladder';
import { debtDueDate, isSolveOutcome } from '@/lib/practice';

interface AttemptBody {
  slug?: unknown;
  outcome?: unknown;
  durationSec?: unknown;
  patternGuess?: unknown;
  notes?: unknown;
  /** Set when this attempt is the re-derive that pays off an earlier one. */
  paysDebt?: unknown;
}

/** Logs a first attempt at a ladder problem, and books the re-derive it owes. */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: AttemptBody = await request.json();

    if (typeof body.slug !== 'string') {
      return NextResponse.json({ error: 'A problem slug is required' }, { status: 400 });
    }
    if (!isSolveOutcome(body.outcome)) {
      return NextResponse.json(
        { error: 'outcome must be unaided, hinted, editorial or failed' },
        { status: 400 },
      );
    }

    // The tier and difficulty come from the catalog, never from the client: they
    // decide the time budget and the readiness checks.
    const found = ladderProblem(body.slug);
    if (!found) {
      return NextResponse.json({ error: 'Not a ladder problem' }, { status: 404 });
    }

    const { rung, problem } = found;
    const outcome = body.outcome;
    const now = new Date();

    const attempt = await prisma.practiceAttempt.create({
      data: {
        userId: session.user.id,
        rungId: rung.id,
        slug: problem.slug,
        tier: problem.tier,
        difficulty: problem.difficulty,
        outcome,
        durationSec:
          typeof body.durationSec === 'number' && body.durationSec >= 0
            ? Math.floor(body.durationSec)
            : null,
        patternGuess:
          typeof body.patternGuess === 'string' && body.patternGuess.trim()
            ? body.patternGuess.trim()
            : null,
        notes:
          typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim() : null,
        debtDueAt: debtDueDate(outcome, now),
      },
    });

    // An unaided re-derive is the only thing that settles an outstanding debt on
    // the same problem. Anything less means it is still owed.
    let cleared = 0;
    if (outcome === 'unaided') {
      const result = await prisma.practiceAttempt.updateMany({
        where: {
          userId: session.user.id,
          slug: problem.slug,
          debtDueAt: { not: null },
          debtClearedAt: null,
          id: { not: attempt.id },
        },
        data: { debtClearedAt: now },
      });
      cleared = result.count;
    }

    return NextResponse.json({ attempt, debtsCleared: cleared });
  } catch (error) {
    console.error('Failed to log practice attempt:', error);
    return NextResponse.json({ error: 'Failed to log attempt' }, { status: 500 });
  }
}
