import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { MASTERY_INTERVAL_DAYS } from '@/lib/spaced-repetition';
import { dedupeByCanonicalKey } from '@/lib/problem-identity';
import { dedupeRevisionQueue } from '@/lib/revision-queue';
import { buildActivityCalendar } from '@/lib/activity';
import { PROJECTS } from '@/lib/roadmap/catalog';
import { mergeProgress, summarizeOverview } from '@/lib/roadmap/progress';
import { loadPracticeState } from '@/lib/practice-store';
import { rungById } from '@/lib/pattern-ladder';
import type { PracticeSummary } from '@/components/practice/practice-tile';
import { DashboardClient, type PatternReadiness } from './dashboard-client';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/');
  }

  const userId = session.user.id;

  const repos = await prisma.repo.findMany({
    where: { userId },
    select: { id: true },
  });

  // Every figure below counts problems, not files: the same problem committed
  // under two paths must not inflate any total on this page.
  const allProblems = await prisma.problem.findMany({
    where: { repo: { userId } },
    select: { id: true, path: true, difficulty: true, updatedAt: true },
  });

  const distinctProblems = dedupeByCanonicalKey(
    allProblems,
    (p) => p.path,
    (a, b) => (b.updatedAt > a.updatedAt ? b : a),
  );

  const totalProblems = distinctProblems.length;

  const difficultyTally = new Map<string | null, number>();
  for (const problem of distinctProblems) {
    difficultyTally.set(
      problem.difficulty,
      (difficultyTally.get(problem.difficulty) ?? 0) + 1,
    );
  }
  const problemsByDifficulty = [...difficultyTally.entries()].map(
    ([difficulty, count]) => ({ difficulty, _count: count }),
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfToday = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const activityWindowDays = 364;
  const activitySince = new Date(today);
  activitySince.setDate(activitySince.getDate() - (activityWindowDays - 1));

  const [allRevisions, recentAttempts, mistakeConcepts, activityStamps, roadmapRow, practice] =
    await Promise.all([
      prisma.revision.findMany({
        where: { userId },
        select: {
          id: true,
          nextDate: true,
          lastRevised: true,
          repetitions: true,
          createdAt: true,
          intervalDays: true,
          problem: { select: { path: true, pattern: true } },
        },
      }),
      prisma.attempt.findMany({
        // Recall rate measures rated recall sessions. A re-solve on the judge
        // advances the schedule but is no evidence of recalling it cold.
        where: { userId, source: 'recall', createdAt: { gte: thirtyDaysAgo } },
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
      prisma.attempt.findMany({
        where: { userId, createdAt: { gte: activitySince } },
        select: { createdAt: true },
      }),
      prisma.roadmapProgress.findUnique({
        where: { userId },
        select: { state: true },
      }),
      loadPracticeState(userId),
    ]);

  const roadmap = summarizeOverview(
    mergeProgress(roadmapRow?.state ?? null),
    PROJECTS.map((p) => p.id),
  );

  // The rung nearest ready that still has something to open, so the tile can
  // name one action instead of a percentage.
  const focusRung = practice.readiness
    .filter((r) => r.status === 'in-progress' && r.nextProblem)
    .sort((a, b) => b.met - a.met)[0];

  const practiceSummary: PracticeSummary = {
    rungsReady: practice.totals.readyRungs,
    rungsTotal: practice.readiness.length,
    solvedUnaided: practice.totals.solvedUnaided,
    attempted: practice.totals.attempted,
    openDebts: practice.totals.openDebts,
    recognitionRate:
      practice.totals.diagnosticsSeen > 0
        ? Math.round(
            (practice.totals.diagnosticsCorrect / practice.totals.diagnosticsSeen) * 100,
          )
        : null,
    diagnosticsSeen: practice.totals.diagnosticsSeen,
    focus:
      focusRung && focusRung.nextProblem
        ? {
            name: rungById(focusRung.rungId)?.name ?? focusRung.rungId,
            met: focusRung.met,
            total: focusRung.total,
            nextTitle: focusRung.nextProblem.title,
            slug: focusRung.nextProblem.slug,
          }
        : null,
  };

  const activity = buildActivityCalendar(
    activityStamps.map((a) => a.createdAt),
    { days: activityWindowDays },
  );

  const revisionsByPattern = dedupeRevisionQueue(allRevisions);
  const totalRevisions = revisionsByPattern.length;
  const dueNow = revisionsByPattern.filter((r) => r.nextDate < endOfToday).length;
  const mastered = revisionsByPattern.filter(
    (r) => r.intervalDays >= MASTERY_INTERVAL_DAYS,
  ).length;

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
      activity={activity}
      roadmap={roadmap}
      practice={practiceSummary}
    />
  );
}
