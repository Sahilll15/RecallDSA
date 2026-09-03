import { prisma } from './prisma';
import { canonicalProblemKey } from './problem-identity';
import { LADDER, rungById, type LadderDifficulty, type LadderTier } from './pattern-ladder';
import { MASTERY_INTERVAL_DAYS } from './spaced-repetition';
import {
  evaluateReadiness,
  lapseWindowStart,
  type PracticeAttempt,
  type RungReadiness,
  type SolveOutcome,
} from './practice';
import type { RecognitionStat } from './diagnostic';

/** Prisma reads for the practice ladder. The rules themselves live in lib/practice.ts. */

export interface DebtRow {
  id: string;
  slug: string;
  title: string;
  rungId: string;
  rungName: string;
  tier: LadderTier;
  difficulty: LadderDifficulty;
  outcome: SolveOutcome;
  dueAt: Date;
  overdue: boolean;
}

export interface PracticeState {
  readiness: RungReadiness[];
  debts: DebtRow[];
  recognition: Map<string, RecognitionStat>;
  touchedRungIds: Set<string>;
  /** Ladder slugs already in the user's repo, so a diagnostic never shows them. */
  solvedSlugs: Set<string>;
  totals: {
    attempted: number;
    solvedUnaided: number;
    readyRungs: number;
    openDebts: number;
    diagnosticsSeen: number;
    diagnosticsCorrect: number;
  };
}

export async function loadPracticeState(userId: string): Promise<PracticeState> {
  const now = new Date();
  const lapseSince = lapseWindowStart(now);

  const [attemptRows, diagnosticRows, revisions, repoProblems] = await Promise.all([
    prisma.practiceAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.diagnosticItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { pattern: true, correct: true, createdAt: true },
    }),
    prisma.revision.findMany({
      where: { userId },
      select: {
        intervalDays: true,
        lapses: true,
        lastRevised: true,
        problem: { select: { pattern: true } },
      },
    }),
    prisma.problem.findMany({
      where: { repo: { userId } },
      select: { path: true },
    }),
  ]);

  const byRung = new Map<string, PracticeAttempt[]>();
  for (const row of attemptRows) {
    const list = byRung.get(row.rungId) ?? [];
    list.push({
      slug: row.slug,
      tier: row.tier as LadderTier,
      difficulty: row.difficulty as LadderDifficulty,
      outcome: row.outcome as SolveOutcome,
      durationSec: row.durationSec,
      createdAt: row.createdAt,
    });
    byRung.set(row.rungId, list);
  }

  const recognition = new Map<string, RecognitionStat>();
  const diagnosticsByPattern = new Map<string, Array<{ correct: boolean; createdAt: Date }>>();
  for (const item of diagnosticRows) {
    const stat = recognition.get(item.pattern) ?? { seen: 0, correct: 0 };
    stat.seen += 1;
    if (item.correct) stat.correct += 1;
    recognition.set(item.pattern, stat);

    const list = diagnosticsByPattern.get(item.pattern) ?? [];
    list.push({ correct: item.correct, createdAt: item.createdAt });
    diagnosticsByPattern.set(item.pattern, list);
  }

  // A lapse only counts against a rung while it is recent: a card that lapsed
  // in March and has held since is evidence of retention, not of a gap.
  const lapsesByPattern = new Map<string, number>();
  const cardsByPattern = new Map<string, number>();
  for (const revision of revisions) {
    const pattern = revision.problem.pattern;
    if (!pattern) continue;
    cardsByPattern.set(pattern, (cardsByPattern.get(pattern) ?? 0) + 1);
    const lapsedRecently =
      revision.lapses > 0 &&
      revision.intervalDays < MASTERY_INTERVAL_DAYS &&
      revision.lastRevised !== null &&
      revision.lastRevised >= lapseSince;
    if (lapsedRecently) {
      lapsesByPattern.set(pattern, (lapsesByPattern.get(pattern) ?? 0) + 1);
    }
  }

  const openDebtRows = attemptRows.filter(
    (row) => row.debtDueAt !== null && row.debtClearedAt === null,
  );
  const openDebtsByRung = new Map<string, number>();
  for (const row of openDebtRows) {
    openDebtsByRung.set(row.rungId, (openDebtsByRung.get(row.rungId) ?? 0) + 1);
  }

  const readiness = LADDER.map((rung) =>
    evaluateReadiness({
      rung,
      attempts: byRung.get(rung.id) ?? [],
      diagnostics: diagnosticsByPattern.get(rung.corePattern) ?? [],
      recentLapses: lapsesByPattern.get(rung.corePattern) ?? 0,
      openDebts: openDebtsByRung.get(rung.id) ?? 0,
      trackedCards: cardsByPattern.get(rung.corePattern) ?? 0,
    }),
  );

  const debts: DebtRow[] = openDebtRows
    .map((row) => {
      const rung = rungById(row.rungId);
      const problem = rung?.problems.find((p) => p.slug === row.slug);
      const dueAt = row.debtDueAt as Date;
      return {
        id: row.id,
        slug: row.slug,
        title: problem?.title ?? row.slug,
        rungId: row.rungId,
        rungName: rung?.name ?? row.rungId,
        tier: row.tier as LadderTier,
        difficulty: row.difficulty as LadderDifficulty,
        outcome: row.outcome as SolveOutcome,
        dueAt,
        overdue: dueAt <= now,
      };
    })
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());

  // Path-derived keys, so a folder named after the problem excludes it too.
  // Near-misses (linked-list-cycle-2 against linked-list-cycle-ii) fall through
  // and only cost a diagnostic item that is less blind than it looks.
  const solvedSlugs = new Set(repoProblems.map((p) => canonicalProblemKey(p.path)));

  const diagnosticsCorrect = diagnosticRows.filter((d) => d.correct).length;

  return {
    readiness,
    debts,
    recognition,
    touchedRungIds: new Set(byRung.keys()),
    solvedSlugs,
    totals: {
      attempted: new Set(attemptRows.map((r) => r.slug)).size,
      solvedUnaided: new Set(
        attemptRows.filter((r) => r.outcome === 'unaided').map((r) => r.slug),
      ).size,
      readyRungs: readiness.filter((r) => r.ready).length,
      openDebts: openDebtRows.length,
      diagnosticsSeen: diagnosticRows.length,
      diagnosticsCorrect,
    },
  };
}

/** Slugs a diagnostic must not draw: solved in the repo, or already attempted. */
export async function contaminatedSlugs(userId: string): Promise<Set<string>> {
  const [attempts, problems] = await Promise.all([
    prisma.practiceAttempt.findMany({ where: { userId }, select: { slug: true } }),
    prisma.problem.findMany({ where: { repo: { userId } }, select: { path: true } }),
  ]);

  return new Set([
    ...attempts.map((a) => a.slug),
    ...problems.map((p) => canonicalProblemKey(p.path)),
  ]);
}
