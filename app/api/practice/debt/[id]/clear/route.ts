import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Marks a re-derive as paid without logging a fresh attempt, for a problem
 * re-derived away from the app. Logging an unaided attempt clears the debt on
 * its own, so this is the manual fallback rather than the normal path.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const attempt = await prisma.practiceAttempt.findUnique({
      where: { id },
      select: { userId: true, debtDueAt: true, debtClearedAt: true },
    });

    if (!attempt || attempt.userId !== session.user.id) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }
    if (attempt.debtDueAt === null) {
      return NextResponse.json({ error: 'Nothing owed on this attempt' }, { status: 400 });
    }
    if (attempt.debtClearedAt !== null) {
      return NextResponse.json({ error: 'Already cleared' }, { status: 409 });
    }

    const updated = await prisma.practiceAttempt.update({
      where: { id },
      data: { debtClearedAt: new Date() },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to clear practice debt:', error);
    return NextResponse.json({ error: 'Failed to clear debt' }, { status: 500 });
  }
}
