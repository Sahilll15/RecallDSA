import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function cleanText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const problem = await prisma.problem.findUnique({
      where: { id },
      include: { repo: { select: { userId: true } } },
    });

    if (!problem || problem.repo.userId !== session.user.id) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    const hints = Array.isArray(body.hints)
      ? body.hints
          .filter((h: unknown): h is string => typeof h === 'string' && h.trim().length > 0)
          .map((h: string) => h.trim())
          .slice(0, 10)
      : [];

    const noteData = {
      keyIdea: cleanText(body.keyIdea),
      approach: cleanText(body.approach),
      edgeCases: cleanText(body.edgeCases),
      complexity: cleanText(body.complexity),
      hints,
    };

    const [note] = await prisma.$transaction([
      prisma.recallNote.upsert({
        where: { problemId: id },
        update: noteData,
        create: { problemId: id, ...noteData },
      }),
      prisma.problem.update({
        where: { id },
        data: { pattern: cleanText(body.pattern) },
      }),
    ]);

    return NextResponse.json(note);
  } catch (error) {
    console.error('Failed to save recall note:', error);
    return NextResponse.json(
      { error: 'Failed to save recall note' },
      { status: 500 },
    );
  }
}
