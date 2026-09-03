import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { loadPracticeState } from '@/lib/practice-store';
import { buildActivityCalendar } from '@/lib/activity';
import { LADDER, ladderProblem, type LadderDifficulty } from '@/lib/pattern-ladder';
import type { PracticePanelData } from '@/components/practice/practice-panel';
import { PracticeClient } from './practice-client';

export default async function PracticePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/');
  }

  const userId = session.user.id;

  const [state, attempts, diagnosticRuns] = await Promise.all([
    loadPracticeState(userId),
    prisma.practiceAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { rungId: true, slug: true, outcome: true, createdAt: true },
    }),
    prisma.diagnosticItem.groupBy({
      by: ['runId'],
      where: { userId },
      _min: { createdAt: true },
    }),
  ]);

  // Which problems read as cleared and which still owe something. Newest
  // attempt per problem wins, so a paid-off debt stops showing as owed.
  const byRung = new Map<string, { cleared: string[]; owed: string[] }>();
  const seen = new Set<string>();
  for (const attempt of attempts) {
    if (seen.has(attempt.slug)) continue;
    seen.add(attempt.slug);
    const entry = byRung.get(attempt.rungId) ?? { cleared: [], owed: [] };
    if (attempt.outcome === 'unaided') entry.cleared.push(attempt.slug);
    else entry.owed.push(attempt.slug);
    byRung.set(attempt.rungId, entry);
  }

  // The gauge counts problems, not ladder entries: two problems sit on two rungs.
  const unique = new Map<string, LadderDifficulty>();
  for (const rung of LADDER) for (const p of rung.problems) unique.set(p.slug, p.difficulty);
  const byDifficulty: PracticePanelData['byDifficulty'] = {
    easy: { solved: 0, total: 0 },
    medium: { solved: 0, total: 0 },
    hard: { solved: 0, total: 0 },
  };
  for (const level of unique.values()) byDifficulty[level].total += 1;
  const clearedSlugs = new Set(
    [...byRung.values()].flatMap((entry) => entry.cleared),
  );
  for (const slug of clearedSlugs) {
    const level = ladderProblem(slug)?.problem.difficulty;
    if (level) byDifficulty[level].solved += 1;
  }

  // Any logged attempt is a day practised; a diagnostic run counts once.
  const activity = buildActivityCalendar(
    [
      ...attempts.map((a) => a.createdAt),
      ...diagnosticRuns.map((r) => r._min.createdAt).filter((d): d is Date => d !== null),
    ],
    { days: 84 },
  );

  const panel: PracticePanelData = {
    solvedUnaided: clearedSlugs.size,
    totalProblems: unique.size,
    byDifficulty,
    rungsComplete: 0,
    rungsReady: state.totals.readyRungs,
    rungsTotal: state.readiness.length,
    recognitionRate:
      state.totals.diagnosticsSeen > 0
        ? Math.round((state.totals.diagnosticsCorrect / state.totals.diagnosticsSeen) * 100)
        : null,
    diagnosticsSeen: state.totals.diagnosticsSeen,
    openDebts: state.totals.openDebts,
    activity: activity.days,
    currentStreak: activity.currentStreak,
    longestStreak: activity.longestStreak,
  };

  return (
    <PracticeClient
      user={session.user}
      readiness={state.readiness}
      totals={state.totals}
      progress={Object.fromEntries(byRung)}
      debts={state.debts.map((debt) => ({ ...debt, dueAt: debt.dueAt.toISOString() }))}
      panel={panel}
    />
  );
}
