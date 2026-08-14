import { describe, expect, it } from 'vitest';
import {
  canonicalProblemKey,
  dedupeSolvedProblems,
  scheduleFromSolveDate,
  type SolvedProblem,
} from './solve-history';

describe('canonicalProblemKey', () => {
  it('collapses the LeetHub and LeetSync namings of the same problem', () => {
    expect(canonicalProblemKey('0875-koko-eating-bananas/0875-koko-eating-bananas.cpp')).toBe(
      canonicalProblemKey('875-koko-eating-bananas/koko-eating-bananas.cpp'),
    );
  });

  it('ignores differing problem numbers for the same slug', () => {
    // LeetHub wrote 1283-, LeetSync wrote 1408- for the same problem
    expect(
      canonicalProblemKey(
        '1283-find-the-smallest-divisor-given-a-threshold/1283-find-the-smallest-divisor-given-a-threshold.cpp',
      ),
    ).toBe(
      canonicalProblemKey(
        '1408-find-the-smallest-divisor-given-a-threshold/find-the-smallest-divisor-given-a-threshold.cpp',
      ),
    );
  });

  it('keeps genuinely different problems apart', () => {
    expect(canonicalProblemKey('0035-search-insert-position/0035-search-insert-position.cpp')).not.toBe(
      canonicalProblemKey('0560-subarray-sum-equals-k/0560-subarray-sum-equals-k.cpp'),
    );
  });

  it('treats the same problem in two languages as one problem', () => {
    expect(canonicalProblemKey('0001-two-sum/0001-two-sum.cpp')).toBe(
      canonicalProblemKey('0001-two-sum/0001-two-sum.js'),
    );
  });

  it('falls back to the filename when the file sits at the repo root', () => {
    expect(canonicalProblemKey('0001-two-sum.cpp')).toBe('two-sum');
  });

  it('does not collapse distinct problems that share a generic filename', () => {
    expect(canonicalProblemKey('binary-search/Solution.java')).not.toBe(
      canonicalProblemKey('two-pointers/Solution.java'),
    );
  });
});

describe('dedupeSolvedProblems', () => {
  const p = (id: string, path: string, solvedAt: string): SolvedProblem => ({
    id,
    path,
    solvedAt: new Date(solvedAt),
  });

  it('keeps one entry per problem', () => {
    const result = dedupeSolvedProblems([
      p('a', '0410-split-array-largest-sum/0410-split-array-largest-sum.cpp', '2026-08-14T02:49:00Z'),
      p('b', '410-split-array-largest-sum/split-array-largest-sum.cpp', '2026-08-14T02:49:00Z'),
    ]);
    expect(result).toHaveLength(1);
  });

  it('keeps the copy solved earliest, since that is when the work happened', () => {
    const result = dedupeSolvedProblems([
      p('later', '875-koko-eating-bananas/koko-eating-bananas.cpp', '2026-08-12T22:00:00Z'),
      p('earlier', '0875-koko-eating-bananas/0875-koko-eating-bananas.cpp', '2026-08-12T20:11:00Z'),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('earlier');
  });

  it('leaves distinct problems untouched', () => {
    const input = [
      p('a', '0069-sqrtx/0069-sqrtx.cpp', '2026-08-12T18:47:00Z'),
      p('b', '0875-koko-eating-bananas/0875-koko-eating-bananas.cpp', '2026-08-12T20:11:00Z'),
    ];
    expect(dedupeSolvedProblems(input)).toHaveLength(2);
  });

  it('returns an empty list for no input', () => {
    expect(dedupeSolvedProblems([])).toEqual([]);
  });
});

describe('scheduleFromSolveDate', () => {
  const now = new Date('2026-08-14T12:00:00Z');

  it('puts the first review one day after the solve', () => {
    const solvedAt = new Date('2026-08-14T02:00:00Z');
    const { nextDate, intervalDays } = scheduleFromSolveDate(solvedAt);
    expect(intervalDays).toBe(1);
    expect(nextDate.getTime()).toBe(solvedAt.getTime() + 24 * 60 * 60 * 1000);
  });

  it('marks an older solve as already due rather than inventing past reviews', () => {
    const solvedAt = new Date('2026-08-10T10:00:00Z');
    const { nextDate, intervalDays } = scheduleFromSolveDate(solvedAt);
    expect(nextDate.getTime()).toBeLessThan(now.getTime());
    expect(intervalDays).toBe(1);
  });

  it('orders an older solve ahead of a newer one in the due queue', () => {
    const older = scheduleFromSolveDate(new Date('2026-08-10T10:00:00Z'));
    const newer = scheduleFromSolveDate(new Date('2026-08-12T20:00:00Z'));
    expect(older.nextDate.getTime()).toBeLessThan(newer.nextDate.getTime());
  });
});
