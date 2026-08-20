import { describe, expect, it } from 'vitest';
import { formatProblemTitle, mapWithConcurrency } from './utils';

describe('formatProblemTitle', () => {
  it('shouts a trailing roman numeral', () => {
    expect(formatProblemTitle('Combination Sum Iii')).toBe('Combination Sum III');
    expect(formatProblemTitle('Permutations Ii')).toBe('Permutations II');
    expect(formatProblemTitle('House Robber Iv')).toBe('House Robber IV');
  });

  it('leaves a title without a numeral alone', () => {
    expect(formatProblemTitle('Split Array Largest Sum')).toBe('Split Array Largest Sum');
  });

  it('does not shout a word that merely looks like a numeral mid-title', () => {
    expect(formatProblemTitle('Ix Marks The Spot')).toBe('Ix Marks The Spot');
  });

  it('uppercases known acronyms anywhere in the title', () => {
    expect(formatProblemTitle('Validate Bst')).toBe('Validate BST');
    expect(formatProblemTitle('Lru Cache')).toBe('LRU Cache');
  });

  it('never returns a bare numeral for a single-word title', () => {
    expect(formatProblemTitle('Ii')).toBe('Ii');
  });
});

describe('mapWithConcurrency', () => {
  it('preserves input order regardless of completion order', async () => {
    const delays = [30, 10, 20];
    const result = await mapWithConcurrency(
      delays,
      3,
      (ms: number, i: number) => new Promise<number>((resolve) => setTimeout(() => resolve(i), ms)),
    );
    expect(result).toEqual([0, 1, 2]);
  });

  it('never runs more than `limit` workers at once', async () => {
    let active = 0;
    let maxActive = 0;

    await mapWithConcurrency([1, 2, 3, 4, 5, 6], 2, async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((r) => setTimeout(r, 5));
      active--;
    });

    expect(maxActive).toBeLessThanOrEqual(2);
  });

  it('runs every item exactly once', async () => {
    const seen: number[] = [];
    await mapWithConcurrency([1, 2, 3, 4], 2, async (item) => {
      seen.push(item);
    });
    expect(seen.sort()).toEqual([1, 2, 3, 4]);
  });

  it('handles an empty list', async () => {
    expect(await mapWithConcurrency([], 4, async (x) => x)).toEqual([]);
  });

  it('caps concurrency to the item count when limit is larger', async () => {
    const result = await mapWithConcurrency([1, 2], 10, async (x) => x * 2);
    expect(result).toEqual([2, 4]);
  });
});
