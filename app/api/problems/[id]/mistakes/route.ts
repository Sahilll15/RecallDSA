import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const body = await request.json();

    const description =
      typeof body.description === 'string' ? body.description.trim() : '';
    if (!description) {
      return NextResponse.json(
        { error: 'A mistake description is required' },
        { status: 400 },
      );
    }

    const problem = await prisma.problem.findUnique({
      where: { id },
      include: { repo: { select: { userId: true } } },
    });

    if (!problem || problem.repo.userId !== session.user.id) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    const mistake = await prisma.mistake.create({
      data: {
        userId: session.user.id,
        problemId: id,
        description,
        concept:
          typeof body.concept === 'string' && body.concept.trim()
            ? body.concept.trim()
            : null,
      },
    });

    return NextResponse.json(mistake, { status: 201 });
  } catch (error) {
    console.error('Failed to record mistake:', error);
    return NextResponse.json(
      { error: 'Failed to record mistake' },
      { status: 500 },
    );
  }
}
