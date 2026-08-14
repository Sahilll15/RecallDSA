import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { MASTERY_INTERVAL_DAYS } from '@/lib/spaced-repetition';
import { DashboardClient, type PatternReadiness } from './dashboard-client';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/');
  }

  const userId = session.user.id;

  const repos = await prisma.repo.findMany({
    where: { userId },
    include: {
      _count: {
        select: { problems: true },
      },
    },
  });

  const totalProblems = repos.reduce(
    (sum, repo) => sum + repo._count.problems,
    0,
  );

  const problemsByDifficulty = await prisma.problem.groupBy({
    by: ['difficulty'],
    where: { repo: { userId } },
    _count: true,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfToday = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalRevisions, dueNow, mastered, revisionsByPattern, recentAttempts, mistakeConcepts] =
    await Promise.all([
      prisma.revision.count({ where: { userId } }),
      prisma.revision.count({
        where: { userId, nextDate: { lt: endOfToday } },
      }),
      prisma.revision.count({
        where: { userId, intervalDays: { gte: MASTERY_INTERVAL_DAYS } },
      }),
      prisma.revision.findMany({
        where: { userId },
        select: {
          intervalDays: true,
          problem: { select: { pattern: true } },
        },
      }),
      prisma.attempt.findMany({
        where: { userId, createdAt: { gte: thirtyDaysAgo } },
        select: {
          rating: true,
          patternRecognized: true,
          hintsUsed: true,
          durationSec: true,
          problem: { select: { pattern: true } },
        },
      }),
      prisma.mistake.groupBy({
        by: ['concept'],
        where: { userId, concept: { not: null } },
        _count: true,
        orderBy: { _count: { concept: 'desc' } },
        take: 5,
      }),
    ]);

  const patternMap = new Map<
    string,
    { tracked: number; mastered: number; attempts: number; struggles: number }
  >();

  for (const revision of revisionsByPattern) {
    const pattern = revision.problem.pattern;
    if (!pattern) continue;
    const entry = patternMap.get(pattern) ?? { tracked: 0, mastered: 0, attempts: 0, struggles: 0 };
    entry.tracked += 1;
    if (revision.intervalDays >= MASTERY_INTERVAL_DAYS) entry.mastered += 1;
    patternMap.set(pattern, entry);
  }

  for (const attempt of recentAttempts) {
    const pattern = attempt.problem.pattern;
    if (!pattern) continue;
    const entry = patternMap.get(pattern) ?? { tracked: 0, mastered: 0, attempts: 0, struggles: 0 };
    entry.attempts += 1;
    const struggled =
      attempt.rating === 'again' ||
      attempt.rating === 'hard' ||
      attempt.patternRecognized === false ||
      attempt.hintsUsed > 0;
    if (struggled) entry.struggles += 1;
    patternMap.set(pattern, entry);
  }

  const patterns: PatternReadiness[] = [...patternMap.entries()]
    .map(([pattern, entry]) => ({ pattern, ...entry }))
    .sort((a, b) => b.tracked - a.tracked);

  const totalAttempts = recentAttempts.length;
  const recalled = recentAttempts.filter(
    (a) => a.rating === 'good' || a.rating === 'easy',
  ).length;
  const patternJudged = recentAttempts.filter((a) => a.patternRecognized !== null);
  const patternHits = patternJudged.filter((a) => a.patternRecognized === true).length;
  const hintFree = recentAttempts.filter((a) => a.hintsUsed === 0).length;
  const timed = recentAttempts.filter((a) => a.durationSec !== null);
  const avgMinutes =
    timed.length > 0
      ? Math.round(
          timed.reduce((sum, a) => sum + (a.durationSec ?? 0), 0) / timed.length / 60,
        )
      : null;

  return (
    <DashboardClient
      user={session.user}
      stats={{
        totalProblems,
        totalRevisions,
        dueNow,
        mastered,
        repos: repos.length,
      }}
      readiness={{
        totalAttempts,
        recallRate: totalAttempts > 0 ? Math.round((recalled / totalAttempts) * 100) : null,
        patternRate:
          patternJudged.length > 0
            ? Math.round((patternHits / patternJudged.length) * 100)
            : null,
        hintFreeRate: totalAttempts > 0 ? Math.round((hintFree / totalAttempts) * 100) : null,
        avgMinutes,
        patterns,
        recurringConcepts: mistakeConcepts
          .filter((m) => m._count >= 2 && m.concept)
          .map((m) => ({ concept: m.concept as string, count: m._count })),
      }}
      problemsByDifficulty={problemsByDifficulty}
    />
  );
}
