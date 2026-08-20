import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redundantRevisions } from '@/lib/revision-queue';

const SELECT = {
  id: true,
  nextDate: true,
  lastRevised: true,
  repetitions: true,
  createdAt: true,
  problem: { select: { title: true, path: true } },
} as const;

/** How many duplicate cards are sitting in the queue, without touching them. */
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const revisions = await prisma.revision.findMany({
    where: { userId: session.user.id },
    select: SELECT,
  });

  const redundant = redundantRevisions(revisions);

  return NextResponse.json({
    duplicates: redundant.length,
    total: revisions.length,
    titles: [...new Set(redundant.map((r) => r.problem.title))],
  });
}

/**
 * Deletes the redundant cards left behind by earlier syncs, keeping the copy
 * that holds the review history. Attempts and mistakes hang off the problem,
 * not the card, so no recall history is lost.
 */
export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const revisions = await prisma.revision.findMany({
      where: { userId: session.user.id },
      select: SELECT,
    });

    const redundant = redundantRevisions(revisions);

    if (redundant.length === 0) {
      return NextResponse.json({ removed: 0, remaining: revisions.length, titles: [] });
    }

    const { count } = await prisma.revision.deleteMany({
      where: { userId: session.user.id, id: { in: redundant.map((r) => r.id) } },
    });

    return NextResponse.json({
      removed: count,
      remaining: revisions.length - count,
      titles: [...new Set(redundant.map((r) => r.problem.title))],
    });
  } catch (error) {
    console.error('Failed to remove duplicate revisions:', error);
    return NextResponse.json(
      { error: 'Failed to remove duplicate revisions' },
      { status: 500 },
    );
  }
}
