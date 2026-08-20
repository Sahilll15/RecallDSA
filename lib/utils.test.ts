import { describe, expect, it } from 'vitest';
import { formatProblemTitle } from './utils';

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
