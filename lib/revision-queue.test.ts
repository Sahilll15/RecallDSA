import { describe, expect, it } from 'vitest';
import {
  dedupeRevisionQueue,
  preferredRevision,
  redundantRevisions,
  type RevisionLike,
} from './revision-queue';

const rev = (
  id: string,
  path: string,
  overrides: Partial<Omit<RevisionLike, 'id' | 'problem'>> = {},
): RevisionLike => ({
  id,
  nextDate: '2026-08-20T00:00:00Z',
  lastRevised: null,
  repetitions: 0,
  createdAt: '2026-08-14T00:00:00Z',
  problem: { path },
  ...overrides,
});

describe('dedupeRevisionQueue', () => {
  it('shows one card for a problem stored under two paths', () => {
    const queue = dedupeRevisionQueue([
      rev('a', '0046-permutations/0046-permutations.cpp'),
      rev('b', 'backtracking/permutations.js'),
    ]);

    expect(queue).toHaveLength(1);
  });

  it('keeps the copy with review history', () => {
    const queue = dedupeRevisionQueue([
      rev('fresh', '0046-permutations/permutations.cpp'),
      rev('reviewed', 'backtracking/permutations.js', {
        repetitions: 3,
        lastRevised: '2026-08-18T00:00:00Z',
      }),
    ]);

    expect(queue).toHaveLength(1);
    expect(queue[0].id).toBe('reviewed');
  });

  it('breaks a tie on review count by whichever was revised most recently', () => {
    const queue = dedupeRevisionQueue([
      rev('older', 'a/two-sum.cpp', { repetitions: 2, lastRevised: '2026-08-10T00:00:00Z' }),
      rev('newer', 'two-sum/Solution.java', {
        repetitions: 2,
        lastRevised: '2026-08-19T00:00:00Z',
      }),
    ]);

    expect(queue[0].id).toBe('newer');
  });

  it('breaks a full tie by the card that comes up soonest', () => {
    const queue = dedupeRevisionQueue([
      rev('later', 'a/two-sum.cpp', { nextDate: '2026-09-01T00:00:00Z' }),
      rev('sooner', 'two-sum/Solution.java', { nextDate: '2026-08-21T00:00:00Z' }),
    ]);

    expect(queue[0].id).toBe('sooner');
  });

  it('leaves genuinely different problems in the queue', () => {
    const queue = dedupeRevisionQueue([
      rev('a', 'backtracking/permutations.js'),
      rev('b', 'backtracking/subsets.js'),
      rev('c', 'binary-search/Solution.java'),
    ]);

    expect(queue).toHaveLength(3);
  });

  it('collapses three copies of one problem down to one', () => {
    const queue = dedupeRevisionQueue([
      rev('a', '0046-permutations/0046-permutations.cpp'),
      rev('b', '46-permutations/permutations.cpp'),
      rev('c', 'backtracking/permutations.py'),
    ]);

    expect(queue).toHaveLength(1);
  });

  it('handles an empty queue', () => {
    expect(dedupeRevisionQueue([])).toEqual([]);
  });
});

describe('preferredRevision', () => {
  it('is stable regardless of argument order', () => {
    const a = rev('a', 'x/two-sum.cpp', { repetitions: 5 });
    const b = rev('b', 'y/two-sum.cpp', { repetitions: 1 });

    expect(preferredRevision(a, b).id).toBe('a');
    expect(preferredRevision(b, a).id).toBe('a');
  });
});

describe('redundantRevisions', () => {
  it('returns only the copies that should be deleted', () => {
    const stale = redundantRevisions([
      rev('keep', 'backtracking/permutations.js', { repetitions: 4 }),
      rev('drop', '0046-permutations/permutations.cpp'),
      rev('untouched', 'binary-search/Solution.java'),
    ]);

    expect(stale.map((r) => r.id)).toEqual(['drop']);
  });

  it('returns nothing when the queue is already clean', () => {
    expect(
      redundantRevisions([rev('a', 'a/two-sum.cpp'), rev('b', 'b/three-sum.cpp')]),
    ).toEqual([]);
  });
});
