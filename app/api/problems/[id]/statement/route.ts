import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fetchLeetCodeProblem } from '@/lib/leetcode';
import { leetCodeSlugFor } from '@/lib/pattern-detection';
import { sanitizeStatementHtml } from '@/lib/sanitize-html';

/** The problem to read before recalling anything, fetched from the judge. */
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

    const problem = await prisma.problem.findUnique({
      where: { id },
      select: { path: true, title: true, repo: { select: { userId: true } } },
    });

    if (!problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }
    if (problem.repo.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const slug = leetCodeSlugFor(problem.path);
    const remote = await fetchLeetCodeProblem(slug);

    if (!remote) {
      return NextResponse.json({
        available: false,
        slug,
        // A guess is still useful: the user can open it and check.
        url: `https://leetcode.com/problems/${slug}/`,
      });
    }

    return NextResponse.json({
      available: true,
      slug: remote.titleSlug,
      number: remote.number,
      title: remote.title,
      difficulty: remote.difficulty,
      tags: remote.tags,
      hints: remote.hints.map(sanitizeStatementHtml),
      url: `https://leetcode.com/problems/${remote.titleSlug}/`,
      contentHtml: sanitizeStatementHtml(remote.contentHtml ?? ''),
    });
  } catch (error) {
    console.error('Failed to fetch problem statement:', error);
    return NextResponse.json({ error: 'Failed to fetch statement' }, { status: 500 });
  }
}
