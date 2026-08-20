import { describe, expect, it } from 'vitest';
import {
  detectPatternFromPath,
  patternFromTags,
} from './pattern-detection';

describe('patternFromTags', () => {
  it('prefers the technique over the container', () => {
    // The old detector saw "array" in the path and filed this under Arrays.
    expect(
      patternFromTags(
        ['array', 'binary-search', 'dynamic-programming', 'greedy', 'prefix-sum'],
        'split-array-largest-sum',
      ),
    ).toBe('binary-search-on-answer');
  });

  it('recognises a search over the answer space', () => {
    expect(
      patternFromTags(['array', 'binary-search'], 'find-the-smallest-divisor-given-a-threshold'),
    ).toBe('binary-search-on-answer');
    expect(
      patternFromTags(['array', 'binary-search'], 'capacity-to-ship-packages-within-d-days'),
    ).toBe('binary-search-on-answer');
  });

  it('keeps a search over sorted data as plain binary search', () => {
    expect(
      patternFromTags(['array', 'binary-search'], 'find-minimum-in-rotated-sorted-array'),
    ).toBe('binary-search');
    expect(patternFromTags(['array', 'binary-search'], 'search-insert-position')).toBe(
      'binary-search',
    );
  });

  it('maps a sliding window ahead of the array it slides over', () => {
    expect(
      patternFromTags(['hash-table', 'string', 'sliding-window'], 'longest-substring-without-repeating-characters'),
    ).toBe('sliding-window');
  });

  it('files a tree problem as trees and a BST problem as bst', () => {
    expect(patternFromTags(['tree', 'depth-first-search', 'binary-tree'], 'invert-binary-tree')).toBe(
      'trees',
    );
    expect(
      patternFromTags(['tree', 'binary-search-tree', 'binary-tree'], 'validate-binary-search-tree'),
    ).toBe('bst');
  });

  it('prefers backtracking over the array it builds', () => {
    expect(patternFromTags(['array', 'backtracking'], 'permutations')).toBe('backtracking');
  });

  it('falls back to arrays only when nothing more specific is tagged', () => {
    expect(patternFromTags(['array'], 'running-sum-of-1d-array')).toBe('arrays');
  });

  it('returns null when no tag maps', () => {
    expect(patternFromTags(['database', 'shell'], 'combine-two-tables')).toBeNull();
    expect(patternFromTags([], 'anything')).toBeNull();
  });

  it('prefers a monotonic stack over a plain stack', () => {
    expect(patternFromTags(['array', 'stack', 'monotonic-stack'], 'daily-temperatures')).toBe(
      'monotonic-stack',
    );
  });
});

describe('detectPatternFromPath', () => {
  it('trusts a directory the user named after a pattern', () => {
    expect(detectPatternFromPath('binary-search/Solution.java')).toBe('binary-search');
    expect(detectPatternFromPath('dp/coin-change.cpp')).toBe('dynamic-programming');
    expect(detectPatternFromPath('DSU/number-of-provinces.py')).toBe('union-find');
  });

  it('picks the deepest pattern folder, not the first', () => {
    expect(detectPatternFromPath('leetcode/medium/sliding-window/x.cpp')).toBe(
      'sliding-window',
    );
  });

  it('ignores difficulty and platform folders', () => {
    expect(detectPatternFromPath('leetcode/medium/0046-permutations/permutations.cpp')).toBe(
      'backtracking',
    );
  });

  it('reads an unmistakable phrase out of the problem slug', () => {
    expect(detectPatternFromPath('0046-permutations/0046-permutations.cpp')).toBe(
      'backtracking',
    );
    expect(detectPatternFromPath('0216-combination-sum-iii/main.cpp')).toBe('backtracking');
    expect(detectPatternFromPath('0206-reverse-linked-list/x.cpp')).toBe('linked-list');
  });

  it('no longer files a binary-search problem under arrays', () => {
    // "array" appears in the slug but names the input, not the technique.
    expect(detectPatternFromPath('0410-split-array-largest-sum/x.cpp')).not.toBe('arrays');
  });

  it('does not match a pattern word inside a longer word', () => {
    // "entries" contains "trie"; "cheapest" contains "heap".
    expect(detectPatternFromPath('1234-count-entries/x.cpp')).toBeNull();
    expect(detectPatternFromPath('0787-cheapest-flights/x.cpp')).not.toBe('heap');
  });

  it('returns null rather than guessing', () => {
    expect(detectPatternFromPath('0007-reverse-integer/x.cpp')).toBeNull();
  });
});
