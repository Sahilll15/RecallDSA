import { describe, expect, it } from 'vitest';
import {
  BLIND_WINDOW,
  DEBT_DAYS,
  STREAK_TARGET,
  debtDueDate,
  evaluateReadiness,
  isSolveOutcome,
  latestBySlug,
  nextProblem,
  unaidedStreak,
  type PracticeAttempt,
  type ReadinessInput,
  type SolveOutcome,
} from './practice';
import { rungById, type LadderRung } from './pattern-ladder';

const rung = rungById('sliding-window-variable') as LadderRung;

function attempt(
  slug: string,
  outcome: SolveOutcome,
  overrides: Partial<PracticeAttempt> = {},
): PracticeAttempt {
  return {
    slug,
    tier: 'rep',
    difficulty: 'medium',
    outcome,
    durationSec: 20 * 60,
    createdAt: new Date('2026-09-01T10:00:00Z'),
    ...overrides,
  };
}

/** Newest first, matching the order every caller reads out of Prisma. */
function newestFirst(...attempts: PracticeAttempt[]): PracticeAttempt[] {
  return attempts.map((a, i) =>
    a.createdAt.getTime() === new Date('2026-09-01T10:00:00Z').getTime()
      ? { ...a, createdAt: new Date(Date.now() - i * 60_000) }
      : a,
  );
}

function input(overrides: Partial<ReadinessInput> = {}): ReadinessInput {
  return {
    rung,
    attempts: [],
    diagnostics: [],
    recentLapses: 0,
    openDebts: 0,
    trackedCards: 0,
    ...overrides,
  };
}

describe('isSolveOutcome', () => {
  it('accepts the four honest states and nothing else', () => {
    expect(isSolveOutcome('unaided')).toBe(true);
    expect(isSolveOutcome('editorial')).toBe(true);
    expect(isSolveOutcome('solved')).toBe(false);
    expect(isSolveOutcome(true)).toBe(false);
  });
});

describe('debtDueDate', () => {
  it('books nothing for an unaided solve', () => {
    expect(debtDueDate('unaided')).toBeNull();
  });

  it('books a re-derive for every outcome that used help', () => {
    const from = new Date('2026-09-01T10:00:00Z');
    for (const outcome of ['hinted', 'editorial', 'failed'] as SolveOutcome[]) {
      const due = debtDueDate(outcome, from) as Date;
      const days = (due.getTime() - from.getTime()) / (24 * 60 * 60 * 1000);
      expect(days).toBeGreaterThan(0);
      expect(days).toBeLessThanOrEqual(DEBT_DAYS[outcome] as number);
    }
  });

  it('lands on a date boundary so a debt is due for the whole day', () => {
    const due = debtDueDate('editorial', new Date('2026-09-01T23:30:00Z')) as Date;
    expect(due.getHours()).toBe(0);
    expect(due.getMinutes()).toBe(0);
  });
});

describe('unaidedStreak', () => {
  it('counts consecutive unaided solves on distinct problems', () => {
    const attempts = newestFirst(
      attempt('a', 'unaided'),
      attempt('b', 'unaided'),
      attempt('c', 'unaided'),
    );
    expect(unaidedStreak(attempts)).toBe(3);
  });

  it('stops at the first attempt that used help', () => {
    const attempts = newestFirst(
      attempt('a', 'unaided'),
      attempt('b', 'hinted'),
      attempt('c', 'unaided'),
    );
    expect(unaidedStreak(attempts)).toBe(1);
  });

  it('does not let re-solving one problem four times pass for four problems', () => {
    const attempts = newestFirst(
      attempt('a', 'unaided'),
      attempt('a', 'unaided'),
      attempt('a', 'unaided'),
      attempt('a', 'unaided'),
    );
    expect(unaidedStreak(attempts)).toBe(1);
  });

  it('is zero when the newest attempt used help, however good the history', () => {
    const attempts = newestFirst(
      attempt('e', 'editorial'),
      attempt('a', 'unaided'),
      attempt('b', 'unaided'),
      attempt('c', 'unaided'),
      attempt('d', 'unaided'),
    );
    expect(unaidedStreak(attempts)).toBe(0);
  });
});

describe('latestBySlug', () => {
  it('keeps the newest attempt per problem so a re-derive supersedes the debt', () => {
    const older = attempt('a', 'editorial', { createdAt: new Date('2026-09-01T10:00:00Z') });
    const newer = attempt('a', 'unaided', { createdAt: new Date('2026-09-03T10:00:00Z') });
    const latest = latestBySlug([newer, older]);
    expect(latest.get('a')?.outcome).toBe('unaided');
  });
});

describe('nextProblem', () => {
  it('opens the anchor first on an untouched rung', () => {
    expect(nextProblem(rung, [])?.tier).toBe('anchor');
  });

  it('moves up only past problems solved unaided', () => {
    const anchor = rung.problems.find((p) => p.tier === 'anchor')!;
    const hinted = nextProblem(rung, [attempt(anchor.slug, 'hinted')]);
    expect(hinted?.slug).toBe(anchor.slug);

    const cleared = nextProblem(rung, [attempt(anchor.slug, 'unaided')]);
    expect(cleared?.slug).not.toBe(anchor.slug);
  });

  it('returns null once every problem on the rung is solved unaided', () => {
    const all = rung.problems.map((p) => attempt(p.slug, 'unaided', { tier: p.tier }));
    expect(nextProblem(rung, all)).toBeNull();
  });
});

describe('evaluateReadiness', () => {
  it('reports an untouched rung as untouched, not as failing', () => {
    const result = evaluateReadiness(input());
    expect(result.status).toBe('untouched');
    expect(result.ready).toBe(false);
    expect(result.attempted).toBe(0);
  });

  it('needs every check before it calls a rung ready', () => {
    const attempts = newestFirst(
      ...['a', 'b', 'c', 'd'].map((s) => attempt(s, 'unaided')),
    );
    const result = evaluateReadiness(
      input({
        attempts,
        diagnostics: Array.from({ length: BLIND_WINDOW }, () => ({
          correct: true,
          createdAt: new Date(),
        })),
      }),
    );
    // The twist check is still open: all four solves were reps.
    expect(result.ready).toBe(false);
    expect(result.checks.find((c) => c.id === 'twist')?.met).toBe(false);
  });

  it('calls a rung ready once the streak, blind, pace, twist and debt checks pass', () => {
    const attempts = newestFirst(
      attempt('a', 'unaided', { tier: 'boss', difficulty: 'hard' }),
      ...['b', 'c', 'd'].map((s) => attempt(s, 'unaided')),
    );
    const result = evaluateReadiness(
      input({
        attempts,
        diagnostics: Array.from({ length: BLIND_WINDOW }, () => ({
          correct: true,
          createdAt: new Date(),
        })),
      }),
    );
    expect(result.checks.filter((c) => !c.met)).toEqual([]);
    expect(result.ready).toBe(true);
    expect(result.status).toBe('ready');
  });

  it('fails the blind check while too few statements have been seen', () => {
    const result = evaluateReadiness(
      input({ diagnostics: [{ correct: true, createdAt: new Date() }] }),
    );
    const blind = result.checks.find((c) => c.id === 'blind');
    expect(blind?.met).toBe(false);
    expect(blind?.detail).toContain('1 of 5');
  });

  it('only counts the most recent statements, so an old good run cannot carry it', () => {
    const diagnostics = [
      ...Array.from({ length: BLIND_WINDOW }, () => ({ correct: false, createdAt: new Date() })),
      ...Array.from({ length: 20 }, () => ({ correct: true, createdAt: new Date(0) })),
    ];
    expect(
      evaluateReadiness(input({ diagnostics })).checks.find((c) => c.id === 'blind')?.met,
    ).toBe(false);
  });

  it('holds the pace check open until enough solves have been timed', () => {
    const attempts = newestFirst(attempt('a', 'unaided'), attempt('b', 'unaided'));
    const pace = evaluateReadiness(input({ attempts })).checks.find((c) => c.id === 'pace');
    expect(pace?.met).toBe(false);
    expect(pace?.detail).toContain('2 of 3');
  });

  it('judges pace against each problem difficulty, not one global budget', () => {
    // 30 minutes is over budget for a medium and inside it for a hard.
    const overs = newestFirst(
      ...['a', 'b', 'c'].map((s) => attempt(s, 'unaided', { durationSec: 30 * 60 })),
    );
    expect(
      evaluateReadiness(input({ attempts: overs })).checks.find((c) => c.id === 'pace')?.met,
    ).toBe(false);

    const hards = newestFirst(
      ...['a', 'b', 'c'].map((s) =>
        attempt(s, 'unaided', { durationSec: 30 * 60, difficulty: 'hard' }),
      ),
    );
    expect(
      evaluateReadiness(input({ attempts: hards })).checks.find((c) => c.id === 'pace')?.met,
    ).toBe(true);
  });

  it('fails retention while a card lapsed inside the window', () => {
    const result = evaluateReadiness(input({ recentLapses: 2, trackedCards: 6 }));
    const retention = result.checks.find((c) => c.id === 'retention');
    expect(retention?.met).toBe(false);
    expect(retention?.detail).toBe('2 lapsed');
  });

  it('blocks readiness on an unpaid re-derive', () => {
    const attempts = newestFirst(
      attempt('a', 'unaided', { tier: 'twist' }),
      ...['b', 'c', 'd'].map((s) => attempt(s, 'unaided')),
    );
    const result = evaluateReadiness(
      input({
        attempts,
        openDebts: 1,
        diagnostics: Array.from({ length: BLIND_WINDOW }, () => ({
          correct: true,
          createdAt: new Date(),
        })),
      }),
    );
    expect(result.ready).toBe(false);
    expect(result.checks.find((c) => c.id === 'debts')?.detail).toBe('1 owed');
  });

  it('passes the twist check vacuously on a rung with no twist or boss', () => {
    const easyRung: LadderRung = {
      ...rung,
      problems: rung.problems
        .filter((p) => p.tier === 'anchor' || p.tier === 'rep')
        .map((p) => ({ ...p, tier: 'rep' as const })),
    };
    const twist = evaluateReadiness(input({ rung: easyRung })).checks.find(
      (c) => c.id === 'twist',
    );
    expect(twist?.met).toBe(true);
    expect(twist?.detail).toContain('no twist tier');
  });

  it('needs the full streak target, not one short of it', () => {
    const attempts = newestFirst(
      ...Array.from({ length: STREAK_TARGET - 1 }, (_, i) => attempt(`p${i}`, 'unaided')),
    );
    expect(
      evaluateReadiness(input({ attempts })).checks.find((c) => c.id === 'streak')?.met,
    ).toBe(false);
  });
});
