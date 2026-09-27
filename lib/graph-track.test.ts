import { describe, expect, it } from 'vitest';
import { layerNodes } from './dag-layout';
import {
  GRAPH_PATTERNS,
  PREREQUISITES,
  SIGNALS,
  graphPatternById,
  patternStates,
  sanitizeGraphDone,
} from './graph-track';

describe('graph track catalog', () => {
  it('gives every pattern four or five problems with unique slugs', () => {
    for (const p of GRAPH_PATTERNS) {
      expect(p.problems.length, p.id).toBeGreaterThanOrEqual(4);
      expect(p.problems.length, p.id).toBeLessThanOrEqual(5);
      expect(new Set(p.problems.map((q) => q.slug)).size, p.id).toBe(p.problems.length);
    }
  });

  it('only depends on patterns that exist, with no cycles', () => {
    const ids = new Set(GRAPH_PATTERNS.map((p) => p.id));
    expect(ids.size).toBe(GRAPH_PATTERNS.length);
    for (const p of GRAPH_PATTERNS) for (const d of p.deps) expect(ids.has(d), `${p.id} -> ${d}`).toBe(true);
    const { depth } = layerNodes(GRAPH_PATTERNS);
    for (const p of GRAPH_PATTERNS) {
      for (const d of p.deps) expect(depth.get(p.id)!).toBeGreaterThan(depth.get(d)!);
    }
  });

  it('points every signal at a real pattern', () => {
    for (const s of SIGNALS) expect(graphPatternById(s.pattern), s.pattern).toBeDefined();
  });

  it('uses the same metadata wherever a slug repeats', () => {
    const seen = new Map<string, string>();
    const all = [
      ...PREREQUISITES.flatMap((p) => p.warmups),
      ...GRAPH_PATTERNS.flatMap((p) => p.problems),
    ];
    for (const q of all) {
      const key = `${q.number}|${q.difficulty}|${q.premium ?? false}`;
      if (seen.has(q.slug)) expect(seen.get(q.slug), q.slug).toBe(key);
      seen.set(q.slug, key);
    }
  });
});

describe('patternStates', () => {
  it('opens roots, locks the rest, and opens a child once its deps are half done', () => {
    const empty = patternStates({});
    expect(empty.get('dfs')).toBe('next');
    expect(empty.get('grid')).toBe('locked');

    const dfs = graphPatternById('dfs')!;
    const half = Object.fromEntries(
      dfs.problems.slice(0, Math.ceil(dfs.problems.length / 2)).map((q) => [q.slug, true as const]),
    );
    const s = patternStates(half);
    expect(s.get('dfs')).toBe('active');
    expect(s.get('grid')).toBe('next');

    const all = Object.fromEntries(dfs.problems.map((q) => [q.slug, true as const]));
    expect(patternStates(all).get('dfs')).toBe('done');
  });
});

describe('sanitizeGraphDone', () => {
  it('keeps only known slugs set to true', () => {
    expect(
      sanitizeGraphDone({ 'number-of-islands': true, 'not-a-problem': true, 'clone-graph': 'yes' }),
    ).toEqual({ 'number-of-islands': true });
    expect(sanitizeGraphDone(null)).toEqual({});
    expect(sanitizeGraphDone(['number-of-islands'])).toEqual({});
  });
});
