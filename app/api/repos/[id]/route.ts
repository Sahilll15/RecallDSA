import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { repoHasNoHistory } from '@/lib/problem-lifecycle';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const repo = await prisma.repo.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        _count: {
          select: { problems: true },
        },
      },
    });

    if (!repo) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(repo);
  } catch (error) {
    console.error('Failed to fetch repo:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repository' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const repo = await prisma.repo.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!repo) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 },
      );
    }

    // The cascade from Repo wipes every Problem beneath it, and Problem
    // cascades further to Revision/Attempt/Mistake/RecallNote. Refuse rather
    // than silently destroying review history that cannot be recreated.
    if (!(await repoHasNoHistory(id))) {
      return NextResponse.json(
        { error: 'This repository has tracked review history and cannot be deleted' },
        { status: 409 },
      );
    }

    await prisma.repo.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete repo:', error);
    return NextResponse.json(
      { error: 'Failed to delete repository' },
      { status: 500 },
    );
  }
}
