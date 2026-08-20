import { describe, expect, it } from 'vitest';
import {
  canonicalProblemKey,
  dedupeByCanonicalKey,
  groupByCanonicalKey,
} from './problem-identity';

describe('canonicalProblemKey', () => {
  it('collapses the same problem stored under a topic folder and a numbered folder', () => {
    expect(canonicalProblemKey('backtracking/permutations.js')).toBe(
      canonicalProblemKey('0046-permutations/0046-permutations.cpp'),
    );
  });

  it('keeps two problems in the same topic folder apart', () => {
    expect(canonicalProblemKey('backtracking/permutations.js')).not.toBe(
      canonicalProblemKey('backtracking/subsets.js'),
    );
  });

  it('collapses the same problem written in two languages', () => {
    expect(canonicalProblemKey('0046-permutations/permutations.cpp')).toBe(
      canonicalProblemKey('0046-permutations/permutations.py'),
    );
  });

  it('ignores a differing problem number on the same slug', () => {
    expect(canonicalProblemKey('1283-find-the-smallest-divisor/1283-find-the-smallest-divisor.cpp')).toBe(
      canonicalProblemKey('1408-find-the-smallest-divisor/find-the-smallest-divisor.cpp'),
    );
  });

  it('falls back to the directory when the filename is generic', () => {
    expect(canonicalProblemKey('binary-search/Solution.java')).toBe('binary-search');
    expect(canonicalProblemKey('0410-split-array-largest-sum/main.cpp')).toBe(
      'split-array-largest-sum',
    );
  });

  it('does not collapse distinct problems that share a generic filename', () => {
    expect(canonicalProblemKey('binary-search/Solution.java')).not.toBe(
      canonicalProblemKey('two-pointers/Solution.java'),
    );
  });

  it('treats a bare language name as generic', () => {
    expect(canonicalProblemKey('0001-two-sum/cpp.cpp')).toBe('two-sum');
  });

  it('handles a file at the repo root', () => {
    expect(canonicalProblemKey('0001-two-sum.cpp')).toBe('two-sum');
  });

  it('ignores nesting above the problem folder', () => {
    expect(canonicalProblemKey('leetcode/medium/0046-permutations/permutations.cpp')).toBe(
      canonicalProblemKey('0046-permutations/permutations.cpp'),
    );
  });

  it('normalises separators and case', () => {
    expect(canonicalProblemKey('Two_Sum.java')).toBe(canonicalProblemKey('two-sum.py'));
  });
});

describe('groupByCanonicalKey', () => {
  it('gathers every file that belongs to one problem', () => {
    const groups = groupByCanonicalKey(
      [
        { path: '0046-permutations/permutations.cpp' },
        { path: 'backtracking/permutations.js' },
        { path: 'backtracking/subsets.js' },
      ],
      (f) => f.path,
    );

    expect(groups.size).toBe(2);
    expect(groups.get('permutations')).toHaveLength(2);
    expect(groups.get('subsets')).toHaveLength(1);
  });
});

describe('dedupeByCanonicalKey', () => {
  it('keeps one entry per problem', () => {
    const result = dedupeByCanonicalKey(
      [
        { id: 'a', path: '0046-permutations/permutations.cpp' },
        { id: 'b', path: 'backtracking/permutations.js' },
      ],
      (f) => f.path,
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a');
  });

  it('lets the caller choose which copy survives', () => {
    const result = dedupeByCanonicalKey(
      [
        { id: 'a', path: '0046-permutations/permutations.cpp', rank: 1 },
        { id: 'b', path: 'backtracking/permutations.js', rank: 9 },
      ],
      (f) => f.path,
      (x, y) => (y.rank > x.rank ? y : x),
    );

    expect(result[0].id).toBe('b');
  });

  it('leaves distinct problems untouched', () => {
    const result = dedupeByCanonicalKey(
      [{ path: 'a/two-sum.cpp' }, { path: 'a/three-sum.cpp' }],
      (f) => f.path,
    );
    expect(result).toHaveLength(2);
  });
});
