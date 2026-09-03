import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { fetchLeetCodeProblem } from '@/lib/leetcode';
import { ladderProblem } from '@/lib/pattern-ladder';
import { sanitizeStatementHtml } from '@/lib/sanitize-html';

/**
 * A ladder problem's statement. Separate from the /api/problems route because
 * nothing here is in the user's repo: the slug is looked up in the catalog, so
 * an arbitrary slug cannot be used to proxy LeetCode through this app.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slug } = await params;

    const found = ladderProblem(slug);
    if (!found) {
      return NextResponse.json({ error: 'Not a ladder problem' }, { status: 404 });
    }

    const remote = await fetchLeetCodeProblem(found.problem.slug);
    const url = `https://leetcode.com/problems/${found.problem.slug}/`;

    if (!remote) {
      return NextResponse.json({
        available: false,
        slug: found.problem.slug,
        title: found.problem.title,
        url,
      });
    }

    return NextResponse.json({
      available: true,
      slug: remote.titleSlug,
      number: remote.number,
      title: remote.title,
      difficulty: remote.difficulty,
      // Topic tags name the pattern, which is the answer the drill is asking
      // for, so they are dropped here rather than filtered in the client.
      hints: remote.hints.map(sanitizeStatementHtml),
      url,
      contentHtml: sanitizeStatementHtml(remote.contentHtml ?? ''),
    });
  } catch (error) {
    console.error('Failed to fetch ladder statement:', error);
    return NextResponse.json({ error: 'Failed to fetch statement' }, { status: 500 });
  }
}
