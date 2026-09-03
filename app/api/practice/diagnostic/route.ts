import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ladderProblem } from '@/lib/pattern-ladder';
import { patternLabel } from '@/lib/constants';

interface Answer {
  slug?: unknown;
  guess?: unknown;
  seconds?: unknown;
}

interface RunBody {
  runId?: unknown;
  answers?: unknown;
}

/**
 * Grades a blind run and stores it. Grading happens here rather than in the
 * browser so the answers never reach the client before the guesses are in,
 * which is the only thing that makes the run blind.
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: RunBody = await request.json();

    if (typeof body.runId !== 'string' || !body.runId) {
      return NextResponse.json({ error: 'A runId is required' }, { status: 400 });
    }
    if (!Array.isArray(body.answers) || body.answers.length === 0) {
      return NextResponse.json({ error: 'No answers submitted' }, { status: 400 });
    }

    const existing = await prisma.diagnosticItem.count({
      where: { userId: session.user.id, runId: body.runId },
    });
    if (existing > 0) {
      return NextResponse.json({ error: 'This run is already recorded' }, { status: 409 });
    }

    const graded = [];

    for (const raw of body.answers as Answer[]) {
      if (typeof raw.slug !== 'string') continue;
      const found = ladderProblem(raw.slug);
      if (!found) continue;

      const guess = typeof raw.guess === 'string' && raw.guess ? raw.guess : null;
      const pattern = found.rung.corePattern;

      graded.push({
        userId: session.user.id,
        runId: body.runId,
        slug: found.problem.slug,
        rungId: found.rung.id,
        pattern,
        guess,
        // No answer is a miss, not a skip: running out of time on a statement is
        // the same failure as naming the wrong pattern.
        correct: guess === pattern,
        seconds:
          typeof raw.seconds === 'number' && raw.seconds >= 0
            ? Math.floor(raw.seconds)
            : null,
      });
    }

    if (graded.length === 0) {
      return NextResponse.json({ error: 'No gradable answers' }, { status: 400 });
    }

    await prisma.diagnosticItem.createMany({ data: graded });

    return NextResponse.json({
      runId: body.runId,
      score: graded.filter((g) => g.correct).length,
      total: graded.length,
      items: graded.map((g) => ({
        slug: g.slug,
        rungId: g.rungId,
        pattern: g.pattern,
        patternLabel: patternLabel(g.pattern),
        guess: g.guess,
        guessLabel: g.guess ? patternLabel(g.guess) : null,
        correct: g.correct,
      })),
    });
  } catch (error) {
    console.error('Failed to record diagnostic run:', error);
    return NextResponse.json({ error: 'Failed to record run' }, { status: 500 });
  }
}
