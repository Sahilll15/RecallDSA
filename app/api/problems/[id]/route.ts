import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GitHubService, parseRepoFullName } from '@/lib/github';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.id || !session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const problem = await prisma.problem.findUnique({
      where: { id },
      include: {
        repo: true,
        revisions: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    if (problem.repo.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { owner, repo } = parseRepoFullName(problem.repo.fullName);
    const github = new GitHubService(session.accessToken);

    const fileData = await github.getFileContent(
      owner,
      repo,
      problem.path,
      problem.repo.defaultBranch,
    );

    return NextResponse.json({
      ...problem,
      content: fileData?.content || '',
    });
  } catch (error) {
    console.error('Failed to fetch problem:', error);
    return NextResponse.json(
      { error: 'Failed to fetch problem' },
      { status: 500 },
    );
  }
}
