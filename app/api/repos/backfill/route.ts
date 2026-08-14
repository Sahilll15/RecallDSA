import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GitHubService, parseRepoFullName } from '@/lib/github';
import { BACKFILL_MAX_DAYS } from '@/lib/constants';
import {
  dedupeSolvedProblems,
  scheduleFromSolveDate,
  type SolvedProblem,
} from '@/lib/solve-history';

/** Schedules problems solved in the last N days, anchored to when they were solved. */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id || !session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const requestedDays = Number(body?.days);
    const days =
      Number.isFinite(requestedDays) && requestedDays > 0
        ? Math.min(Math.floor(requestedDays), BACKFILL_MAX_DAYS)
        : 7;

    const repo = await prisma.repo.findFirst({
      where: { userId: session.user.id },
    });

    if (!repo) {
      return NextResponse.json(
        { error: 'Connect a repository first' },
        { status: 400 },
      );
    }

    const { owner, repo: repoName } = parseRepoFullName(repo.fullName);
    const github = new GitHubService(session.accessToken);
    const solveDates = await github.getSolveDates(owner, repoName, days);

    if (solveDates.size === 0) {
      return NextResponse.json({ scheduled: 0, skipped: 0, days, problems: [] });
    }

    const problems = await prisma.problem.findMany({
      where: { repoId: repo.id, path: { in: [...solveDates.keys()] } },
      select: { id: true, path: true, title: true, pattern: true },
    });

    // Persist the dates so the library reflects them even if nothing gets scheduled.
    await Promise.all(
      problems.map((p) =>
        prisma.problem.update({
          where: { id: p.id },
          data: { solvedAt: solveDates.get(p.path) },
        }),
      ),
    );

    const candidates: SolvedProblem[] = problems.map((p) => ({
      id: p.id,
      path: p.path,
      solvedAt: solveDates.get(p.path)!,
    }));

    const deduped = dedupeSolvedProblems(candidates);
    const byId = new Map(problems.map((p) => [p.id, p]));

    const alreadyTracked = await prisma.revision.findMany({
      where: { userId: session.user.id, problemId: { in: deduped.map((p) => p.id) } },
      select: { problemId: true },
    });
    const trackedIds = new Set(alreadyTracked.map((r) => r.problemId));

    const toSchedule = deduped.filter((p) => !trackedIds.has(p.id));

    await prisma.$transaction(
      toSchedule.map((problem) => {
        const { nextDate, intervalDays } = scheduleFromSolveDate(problem.solvedAt);
        return prisma.revision.create({
          data: {
            userId: session.user.id!,
            problemId: problem.id,
            nextDate,
            intervalDays,
          },
        });
      }),
    );

    const scheduledProblems = toSchedule
      .sort((a, b) => a.solvedAt.getTime() - b.solvedAt.getTime())
      .map((p) => ({
        id: p.id,
        title: byId.get(p.id)?.title ?? p.path,
        pattern: byId.get(p.id)?.pattern ?? null,
        solvedAt: p.solvedAt.toISOString(),
      }));

    return NextResponse.json({
      days,
      scheduled: toSchedule.length,
      skipped: deduped.length - toSchedule.length,
      duplicatesCollapsed: candidates.length - deduped.length,
      problems: scheduledProblems,
    });
  } catch (error) {
    console.error('Failed to backfill recent solves:', error);
    return NextResponse.json(
      { error: 'Failed to backfill recent solves' },
      { status: 500 },
    );
  }
}
