import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fetchLeetCodeProblem, mapWithConcurrency } from '@/lib/leetcode';
import {
  detectPatternFromPath,
  leetCodeSlugFor,
  patternFromTags,
} from '@/lib/pattern-detection';

const DEFAULT_BATCH = 25;
const MAX_BATCH = 50;

/** How many problems still lack a pattern or a difficulty. */
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const where = { repo: { userId: session.user.id } };

  const [unclassified, total] = await Promise.all([
    prisma.problem.count({ where: { ...where, pattern: null } }),
    prisma.problem.count({ where }),
  ]);

  return NextResponse.json({ unclassified, total });
}

/**
 * Fills in pattern and difficulty from the judge's own topic tags, which is the
 * only reliable source: a repo path names the problem, not the technique.
 *
 * Paged by offset over a stable id ordering, so a caller that walks
 * offset to total terminates even when a problem cannot be classified at all.
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const overwrite = body?.overwrite === true;

    const requested = Number(body?.limit);
    const limit =
      Number.isFinite(requested) && requested > 0
        ? Math.min(Math.floor(requested), MAX_BATCH)
        : DEFAULT_BATCH;

    const rawOffset = Number(body?.offset);
    const offset = Number.isFinite(rawOffset) && rawOffset > 0 ? Math.floor(rawOffset) : 0;

    const where = { repo: { userId: session.user.id } };
    const total = await prisma.problem.count({ where });

    const batch = await prisma.problem.findMany({
      where,
      select: { id: true, path: true, pattern: true, difficulty: true, title: true },
      orderBy: { id: 'asc' },
      skip: offset,
      take: limit,
    });

    const needsWork = overwrite
      ? batch
      : batch.filter((p) => p.pattern === null || p.difficulty === null);

    const results = await mapWithConcurrency(needsWork, 5, async (problem) => {
      const slug = leetCodeSlugFor(problem.path);
      const remote = await fetchLeetCodeProblem(slug);

      const detected =
        (remote ? patternFromTags(remote.tags, slug) : null) ??
        detectPatternFromPath(problem.path);

      const nextPattern = overwrite
        ? (detected ?? problem.pattern)
        : (problem.pattern ?? detected);
      const nextDifficulty = overwrite
        ? (remote?.difficulty ?? problem.difficulty)
        : (problem.difficulty ?? remote?.difficulty ?? null);

      if (nextPattern === problem.pattern && nextDifficulty === problem.difficulty) {
        return null;
      }

      await prisma.problem.update({
        where: { id: problem.id },
        data: { pattern: nextPattern, difficulty: nextDifficulty },
      });

      return { title: problem.title, from: problem.pattern, to: nextPattern };
    });

    const changes = results.filter((c): c is NonNullable<typeof c> => c !== null);
    const nextOffset = offset + batch.length;

    return NextResponse.json({
      total,
      processed: batch.length,
      updated: changes.length,
      nextOffset,
      done: nextOffset >= total || batch.length === 0,
      changes: changes.slice(0, 12),
    });
  } catch (error) {
    console.error('Failed to enrich problems:', error);
    return NextResponse.json({ error: 'Failed to classify problems' }, { status: 500 });
  }
}
