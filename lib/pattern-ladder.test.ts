import { describe, expect, it } from 'vitest';
import { PATTERNS } from './constants';
import { triggerFor } from './pattern-triggers';
import {
  LADDER,
  TIER_ORDER,
  groupedLadder,
  ladderProblem,
  rungById,
  rungsForSlug,
  unknownCorePatterns,
} from './pattern-ladder';

/**
 * The catalog is generated from a source post, so these guard the invariants the
 * rest of the app reads it under rather than re-checking the post's contents.
 */

describe('LADDER catalog', () => {
  it('has every rung joined to a pattern the app knows', () => {
    expect(unknownCorePatterns()).toEqual([]);
  });

  it('has a trigger card for every pattern a rung trains', () => {
    const missing = [...new Set(LADDER.map((r) => r.corePattern))].filter(
      (pattern) => !triggerFor(pattern),
    );
    expect(missing).toEqual([]);
  });

  it('uses unique rung ids', () => {
    const ids = LADDER.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('lists each problem once per rung', () => {
    for (const rung of LADDER) {
      const slugs = rung.problems.map((p) => p.slug);
      expect(new Set(slugs).size, rung.id).toBe(slugs.length);
    }
  });

  it('gives every rung an anchor to start from', () => {
    for (const rung of LADDER) {
      expect(
        rung.problems.some((p) => p.tier === 'anchor'),
        rung.id,
      ).toBe(true);
    }
  });

  it('stores each rung in tier order so it reads bottom-up', () => {
    for (const rung of LADDER) {
      const positions = rung.problems.map((p) => TIER_ORDER.indexOf(p.tier));
      expect([...positions].sort((a, b) => a - b), rung.id).toEqual(positions);
    }
  });

  it('carries a real LeetCode slug, number and difficulty on every problem', () => {
    for (const rung of LADDER) {
      for (const problem of rung.problems) {
        expect(problem.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
        expect(problem.number).toMatch(/^\d+$/);
        expect(['easy', 'medium', 'hard']).toContain(problem.difficulty);
      }
    }
  });

  it('keeps binary search on the answer off the index-based rung', () => {
    const modified = rungById('modified-binary-search');
    expect(modified?.problems.map((p) => p.slug)).not.toContain('koko-eating-bananas');
    expect(rungById('binary-search-on-answer')?.problems.map((p) => p.slug)).toContain(
      'koko-eating-bananas',
    );
  });
});

describe('lookups', () => {
  it('finds a problem and the rung it sits on', () => {
    const found = ladderProblem('minimum-window-substring');
    expect(found?.rung.id).toBe('sliding-window-variable');
    expect(found?.problem.tier).toBe('boss');
  });

  it('returns undefined for a slug outside the catalog', () => {
    expect(ladderProblem('two-sum-but-invented')).toBeUndefined();
  });

  it('reports every rung a shared problem appears on', () => {
    // The source post files Missing Number under both cyclic sort and XOR.
    const rungs = rungsForSlug('missing-number').map((r) => r.id);
    expect(rungs).toContain('cyclic-sort');
    expect(rungs).toContain('bitwise-xor');
  });
});

describe('groupedLadder', () => {
  it('covers every rung exactly once', () => {
    const grouped = groupedLadder().flatMap((g) => g.rungs);
    expect(grouped).toHaveLength(LADDER.length);
    expect(new Set(grouped.map((r) => r.id)).size).toBe(LADDER.length);
  });

  it('never repeats a group heading', () => {
    const headings = groupedLadder().map((g) => g.group);
    expect(new Set(headings).size).toBe(headings.length);
  });
});

describe('PATTERNS', () => {
  it('keeps pattern values unique after the ladder additions', () => {
    const values = PATTERNS.map((p) => p.value);
    expect(new Set(values).size).toBe(values.length);
  });
});
