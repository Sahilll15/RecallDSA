import { describe, expect, it } from 'vitest';
import {
  collectSolves,
  creditSolve,
  monotonicNextDate,
  type CreditableRevision,
} from './solve-credit';
import { initialSchedulingState } from './spaced-repetition';

const DAY = 24 * 60 * 60 * 1000;
const at = (days: number) => new Date(Date.UTC(2026, 7, 20) + days * DAY);

function card(overrides: Partial<CreditableRevision> = {}): CreditableRevision {
  return {
    ...initialSchedulingState(),
    nextDate: at(0),
    lastRevised: null,
    lastSolveCredit: null,
    ...overrides,
  };
}

describe('creditSolve', () => {
  it('treats a solve of a due card as a "good" review', () => {
    const credit = creditSolve(card(), at(0));

    expect(credit.credited).toBe(true);
    if (!credit.credited) return;
    expect(credit.state.intervalDays).toBe(3);
    expect(credit.state.repetitions).toBe(1);
    expect(credit.nextDate).toEqual(at(3));
  });

  it('pushes an overdue card forward from the solve, not from its old due date', () => {
    const credit = creditSolve(card({ nextDate: at(-5) }), at(0));

    expect(credit.credited).toBe(true);
    if (!credit.credited) return;
    expect(credit.nextDate).toEqual(at(3));
  });

  it('leaves a card that is not due yet completely alone', () => {
    const credit = creditSolve(card({ nextDate: at(7) }), at(0));

    expect(credit).toEqual({ credited: false, reason: 'not-due' });
  });

  it('never re-queues a card sooner than it was already due', () => {
    const credit = creditSolve(card({ nextDate: at(0), intervalDays: 30, repetitions: 9 }), at(0));

    expect(credit.credited).toBe(true);
    if (!credit.credited) return;
    expect(credit.nextDate.getTime()).toBeGreaterThanOrEqual(at(0).getTime());
  });

  it('credits the same solve once, however many syncs re-report it', () => {
    const first = creditSolve(card(), at(0));
    expect(first.credited).toBe(true);
    if (!first.credited) return;

    const after = card({
      ...first.state,
      nextDate: first.nextDate,
      lastRevised: first.lastRevised,
      lastSolveCredit: first.lastSolveCredit,
    });

    expect(creditSolve(after, at(0))).toEqual({
      credited: false,
      reason: 'already-credited',
    });
  });

  it('does not double-count a solve the user already rated in the app', () => {
    const rated = card({ nextDate: at(-1), lastRevised: at(0) });

    expect(creditSolve(rated, at(0))).toEqual({
      credited: false,
      reason: 'reviewed-since',
    });
  });

  it('credits a later solve once the card comes due again', () => {
    const credited = card({ nextDate: at(3), lastRevised: at(0), lastSolveCredit: at(0) });

    expect(creditSolve(credited, at(4)).credited).toBe(true);
  });
});

describe('monotonicNextDate', () => {
  it('keeps the later of the two dates', () => {
    expect(monotonicNextDate(at(5), at(1))).toEqual(at(5));
    expect(monotonicNextDate(at(1), at(5))).toEqual(at(5));
  });
});

describe('collectSolves', () => {
  it('keeps the newest solve when one problem was written under two paths', () => {
    const solves = collectSolves([
      ['dsa/two-sum/Solution.java', at(0)],
      ['2026-08-24/two-sum.py', at(4)],
    ]);

    expect(solves.size).toBe(1);
    expect(solves.get('two-sum')).toEqual(at(4));
  });

  it('keeps distinct problems apart', () => {
    const solves = collectSolves([
      ['two-sum.py', at(0)],
      ['three-sum.py', at(0)],
    ]);

    expect([...solves.keys()].sort()).toEqual(['three-sum', 'two-sum']);
  });
});
