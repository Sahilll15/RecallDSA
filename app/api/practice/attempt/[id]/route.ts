import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Undo for a mis-tap on the map. Deleting history is otherwise off the table,
 * so this is scoped to the caller's own attempts and the client only offers it
 * for the attempt it just created.
 */
export async function DELETE(
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
      select: { userId: true },
    });

    if (!attempt || attempt.userId !== session.user.id) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    await prisma.practiceAttempt.delete({ where: { id } });
    return NextResponse.json({ deleted: id });
  } catch (error) {
    console.error('Failed to delete practice attempt:', error);
    return NextResponse.json({ error: 'Failed to delete attempt' }, { status: 500 });
  }
}
