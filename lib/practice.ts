import {
  TIME_BUDGET_MIN,
  TIER_ORDER,
  type LadderDifficulty,
  type LadderProblem,
  type LadderRung,
  type LadderTier,
} from './pattern-ladder';

/**
 * The forward half of practice: how a first solve is recorded, what it owes
 * you afterwards, and when a rung counts as ready.
 *
 * The app used to store one bucket for a solve, so a problem you derived and a
 * problem you read the answer to were indistinguishable. Every readiness figure
 * below rests on that distinction, which is why nothing here accepts a plain
 * boolean "solved".
 */

export type SolveOutcome = 'unaided' | 'hinted' | 'editorial' | 'failed';

export const SOLVE_OUTCOMES: SolveOutcome[] = ['unaided', 'hinted', 'editorial', 'failed'];

export const OUTCOME_LABELS: Record<SolveOutcome, string> = {
  unaided: 'Unaided',
  hinted: 'Hinted',
  editorial: 'Read the editorial',
  failed: 'Gave up',
};

export const OUTCOME_HELP: Record<SolveOutcome, string> = {
  unaided: 'Derived it yourself, no hints and no editorial. The only outcome that counts toward readiness.',
  hinted: 'Got there, but needed a nudge, a hint, or the pattern named for you.',
  editorial: 'Read the solution. Close it and re-derive from blank when the debt comes due.',
  failed: 'Ran out of time without a working solve and without reading the answer.',
};

/**
 * How long before a non-unaided attempt has to be re-derived from blank.
 * Short and fixed, because this is a debt on a problem you cannot yet do, not
 * a spaced review of one you can. The recall queue takes over once it is paid.
 */
export const DEBT_DAYS: Record<SolveOutcome, number | null> = {
  unaided: null,
  hinted: 3,
  editorial: 2,
  failed: 1,
};

/** Consecutive unaided solves on distinct problems that a rung's streak needs. */
export const STREAK_TARGET = 4;
/** Blind statements considered, and how many of them must be named correctly. */
export const BLIND_WINDOW = 5;
export const BLIND_TARGET = 4;
/** Timed unaided solves needed before pace means anything, and the allowed misses. */
export const PACE_SAMPLE = 3;
export const PACE_ALLOWED_OVER = 1;
/** How far back a lapse on the recall queue still counts against a rung. */
export const LAPSE_WINDOW_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

export function isSolveOutcome(value: unknown): value is SolveOutcome {
  return SOLVE_OUTCOMES.includes(value as SolveOutcome);
}

export function isLadderTier(value: unknown): value is LadderTier {
  return TIER_ORDER.includes(value as LadderTier);
}

/** Null for an unaided solve: nothing is owed, so no debt row is created. */
export function debtDueDate(outcome: SolveOutcome, from: Date = new Date()): Date | null {
  const days = DEBT_DAYS[outcome];
  if (days === null) return null;
  const due = new Date(from.getTime() + days * DAY_MS);
  due.setHours(0, 0, 0, 0);
  return due;
}

export interface PracticeAttempt {
  slug: string;
  tier: LadderTier;
  difficulty: LadderDifficulty;
  outcome: SolveOutcome;
  durationSec: number | null;
  createdAt: Date;
}

export interface DiagnosticResult {
  correct: boolean;
  createdAt: Date;
}

export interface ReadinessInput {
  rung: LadderRung;
  /** Newest first. */
  attempts: PracticeAttempt[];
  /** Newest first, already filtered to this rung's corePattern. */
  diagnostics: DiagnosticResult[];
  /** Lapses on this rung's corePattern inside the recall queue, last 14 days. */
  recentLapses: number;
  /** Problems on this rung whose re-derive is owed and not yet cleared. */
  openDebts: number;
  /** Cards for this rung's corePattern currently in the recall queue. */
  trackedCards: number;
}

export interface ReadinessCheck {
  id: 'streak' | 'blind' | 'pace' | 'twist' | 'retention' | 'debts';
  label: string;
  met: boolean;
  /** Where you actually stand. Always a measured figure, never a verdict. */
  detail: string;
  /** The single next thing that would close this gap. */
  action: string;
}

export interface RungReadiness {
  rungId: string;
  checks: ReadinessCheck[];
  met: number;
  total: number;
  ready: boolean;
  /** 0-100, for a progress ring. Not a skill score: it counts checks met. */
  percent: number;
  status: 'untouched' | 'in-progress' | 'ready';
  attempted: number;
  solvedUnaided: number;
  nextProblem: LadderProblem | null;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Consecutive unaided solves, walking back from the newest attempt and counting
 * each problem once. A hinted or read attempt ends the streak, which is what
 * makes the streak mean "four problems in a row I could actually do".
 */
export function unaidedStreak(attempts: PracticeAttempt[]): number {
  const seen = new Set<string>();
  let streak = 0;
  for (const attempt of attempts) {
    if (attempt.outcome !== 'unaided') break;
    if (seen.has(attempt.slug)) continue;
    seen.add(attempt.slug);
    streak += 1;
  }
  return streak;
}

/** Newest attempt per problem, so a re-derive supersedes the attempt it paid off. */
export function latestBySlug(attempts: PracticeAttempt[]): Map<string, PracticeAttempt> {
  const latest = new Map<string, PracticeAttempt>();
  for (const attempt of attempts) {
    const existing = latest.get(attempt.slug);
    if (!existing || attempt.createdAt > existing.createdAt) latest.set(attempt.slug, attempt);
  }
  return latest;
}

/**
 * The one problem to open next: the lowest tier not yet solved unaided. Returns
 * null only when every problem on the rung has been solved unaided.
 */
export function nextProblem(
  rung: LadderRung,
  attempts: PracticeAttempt[],
): LadderProblem | null {
  const cleared = new Set(
    [...latestBySlug(attempts).values()]
      .filter((a) => a.outcome === 'unaided')
      .map((a) => a.slug),
  );

  for (const tier of TIER_ORDER) {
    const candidate = rung.problems.find((p) => p.tier === tier && !cleared.has(p.slug));
    if (candidate) return candidate;
  }
  return null;
}

export function evaluateReadiness(input: ReadinessInput): RungReadiness {
  const { rung, attempts, diagnostics, recentLapses, openDebts, trackedCards } = input;

  const streak = unaidedStreak(attempts);
  const latest = latestBySlug(attempts);
  const solvedUnaided = [...latest.values()].filter((a) => a.outcome === 'unaided').length;

  const blindWindow = diagnostics.slice(0, BLIND_WINDOW);
  const blindHits = blindWindow.filter((d) => d.correct).length;

  const timed = attempts.filter(
    (a) => a.outcome === 'unaided' && a.durationSec !== null,
  );
  const overBudget = timed.filter(
    (a) => (a.durationSec as number) / 60 > TIME_BUDGET_MIN[a.difficulty],
  ).length;
  const paceSampled = timed.length >= PACE_SAMPLE;

  const hardTiers: LadderTier[] = ['twist', 'boss'];
  const twistCleared = [...latest.values()].some(
    (a) => a.outcome === 'unaided' && hardTiers.includes(a.tier),
  );
  const rungHasHardTier = rung.problems.some((p) => hardTiers.includes(p.tier));

  const checks: ReadinessCheck[] = [
    {
      id: 'streak',
      label: `${STREAK_TARGET} problems in a row solved unaided`,
      met: streak >= STREAK_TARGET,
      detail: `${streak} in a row`,
      action:
        streak >= STREAK_TARGET
          ? 'Holding. Keep the next solve unaided to keep it.'
          : `Solve ${STREAK_TARGET - streak} more without hints. One hint resets this to zero.`,
    },
    {
      id: 'blind',
      label: `Pattern named on ${BLIND_TARGET} of the last ${BLIND_WINDOW} blind statements`,
      met: blindWindow.length >= BLIND_WINDOW && blindHits >= BLIND_TARGET,
      detail:
        blindWindow.length < BLIND_WINDOW
          ? `only ${blindWindow.length} of ${BLIND_WINDOW} statements seen`
          : `${blindHits} of ${blindWindow.length} correct`,
      action:
        blindWindow.length < BLIND_WINDOW
          ? 'Run a blind diagnostic. It is six minutes and no coding.'
          : `Recognition is the gap, not the code. Re-read the trigger card for ${rung.corePattern}, then run another diagnostic.`,
    },
    {
      id: 'pace',
      label: 'Solving inside the time budget',
      met: paceSampled && overBudget <= PACE_ALLOWED_OVER,
      detail: paceSampled
        ? `${timed.length - overBudget} of ${timed.length} inside budget, median ${Math.round(
            median(timed.map((a) => (a.durationSec as number) / 60)),
          )} min`
        : `only ${timed.length} of ${PACE_SAMPLE} timed solves`,
      action: paceSampled
        ? 'Derivation is sound but slow. Rehearse the trigger so the first five minutes stop being spent deciding.'
        : `Time ${PACE_SAMPLE - timed.length} more unaided solves.`,
    },
    {
      id: 'twist',
      label: 'A twist or boss problem solved unaided',
      // A rung of four easy reps has nothing harder to prove, so it passes.
      met: twistCleared || !rungHasHardTier,
      detail: twistCleared
        ? 'cleared'
        : rungHasHardTier
          ? 'not yet attempted unaided'
          : 'no twist tier on this rung',
      action: twistCleared
        ? 'Done.'
        : 'The reps are the mechanism undisguised. A twist is where recognition gets tested.',
    },
    {
      id: 'retention',
      label: `Nothing lapsed in ${LAPSE_WINDOW_DAYS} days`,
      met: recentLapses === 0,
      detail:
        trackedCards === 0
          ? 'no cards in the recall queue yet'
          : recentLapses === 0
            ? `${trackedCards} cards holding`
            : `${recentLapses} lapsed`,
      action:
        recentLapses === 0
          ? 'Nothing owed here.'
          : 'Clear the due reviews for this pattern before adding new problems.',
    },
    {
      id: 'debts',
      label: 'No unpaid re-derives',
      met: openDebts === 0,
      detail: openDebts === 0 ? 'none owed' : `${openDebts} owed`,
      action:
        openDebts === 0
          ? 'Nothing owed here.'
          : 'Re-derive them from blank. A problem you read is not a problem you can do.',
    },
  ];

  const met = checks.filter((c) => c.met).length;
  const attempted = latest.size;

  return {
    rungId: rung.id,
    checks,
    met,
    total: checks.length,
    ready: met === checks.length,
    percent: Math.round((met / checks.length) * 100),
    status: attempted === 0 ? 'untouched' : met === checks.length ? 'ready' : 'in-progress',
    attempted,
    solvedUnaided,
    nextProblem: nextProblem(rung, attempts),
  };
}

export function lapseWindowStart(now: Date = new Date()): Date {
  return new Date(now.getTime() - LAPSE_WINDOW_DAYS * DAY_MS);
}
