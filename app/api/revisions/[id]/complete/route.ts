import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  isRecallRating,
  nextDateFrom,
  scheduleNext,
  type RecallRating,
} from '@/lib/spaced-repetition';

interface CompleteBody {
  rating?: unknown;
  patternRecognized?: unknown;
  hintsUsed?: unknown;
  durationSec?: unknown;
  explanation?: unknown;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    let body: CompleteBody = {};
    try {
      body = await request.json();
    } catch {
      // No body: older clients treated completion as a plain "good" review.
    }

    const rating: RecallRating = isRecallRating(body.rating) ? body.rating : 'good';

    const revision = await prisma.revision.findUnique({
      where: { id },
    });

    if (!revision || revision.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Revision not found' },
        { status: 404 },
      );
    }

    const next = scheduleNext(
      {
        intervalDays: revision.intervalDays,
        easeFactor: revision.easeFactor,
        repetitions: revision.repetitions,
        lapses: revision.lapses,
      },
      rating,
    );

    const [updated] = await prisma.$transaction([
      prisma.revision.update({
        where: { id },
        data: {
          lastRevised: new Date(),
          intervalDays: next.intervalDays,
          easeFactor: next.easeFactor,
          repetitions: next.repetitions,
          lapses: next.lapses,
          nextDate: nextDateFrom(next.intervalDays),
        },
      }),
      prisma.attempt.create({
        data: {
          userId: session.user.id,
          problemId: revision.problemId,
          rating,
          patternRecognized:
            typeof body.patternRecognized === 'boolean' ? body.patternRecognized : null,
          hintsUsed:
            typeof body.hintsUsed === 'number' && body.hintsUsed >= 0
              ? Math.floor(body.hintsUsed)
              : 0,
          durationSec:
            typeof body.durationSec === 'number' && body.durationSec >= 0
              ? Math.floor(body.durationSec)
              : null,
          explanation:
            typeof body.explanation === 'string' && body.explanation.trim()
              ? body.explanation.trim()
              : null,
        },
      }),
    ]);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to complete revision:', error);
    return NextResponse.json(
      { error: 'Failed to complete revision' },
      { status: 500 },
    );
  }
}
