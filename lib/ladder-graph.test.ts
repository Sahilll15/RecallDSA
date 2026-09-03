import { describe, expect, it } from 'vitest';
import { LADDER, rungById, type LadderRung } from './pattern-ladder';
import {
  cyclicRungs,
  danglingDeps,
  layoutLadder,
  rungDepths,
  rungStandings,
} from './ladder-graph';

const slugsOf = (id: string, tier?: string) =>
  (rungById(id) as LadderRung).problems
    .filter((p) => (tier ? p.tier === tier : true))
    .map((p) => p.slug);

describe('catalog graph', () => {
  it('has no dep pointing at a rung that does not exist', () => {
    expect(danglingDeps()).toEqual([]);
  });

  it('has no cycles, so every rung can eventually unlock', () => {
    expect(cyclicRungs()).toEqual([]);
  });

  it('has at least one root to start from', () => {
    expect(LADDER.filter((r) => r.deps.length === 0).length).toBeGreaterThan(0);
  });
});

describe('rungDepths', () => {
  it('puts roots at zero and every rung below all of its prerequisites', () => {
    const depths = rungDepths();
    for (const rung of LADDER) {
      const depth = depths.get(rung.id) as number;
      if (rung.deps.length === 0) expect(depth, rung.id).toBe(0);
      for (const dep of rung.deps) {
        expect(depth, `${rung.id} under ${dep}`).toBeGreaterThan(depths.get(dep) as number);
      }
    }
  });

  it('survives a cycle instead of recursing forever', () => {
    const a: LadderRung = { ...(rungById('two-pointers') as LadderRung), id: 'a', deps: ['b'] };
    const b: LadderRung = { ...a, id: 'b', deps: ['a'] };
    expect(() => rungDepths([a, b])).not.toThrow();
  });
});

describe('layoutLadder', () => {
  it('places every rung exactly once', () => {
    const placed = layoutLadder();
    expect(placed).toHaveLength(LADDER.length);
    expect(new Set(placed.map((p) => p.id)).size).toBe(LADDER.length);
  });

  it('gives deeper rungs a larger y, so edges run downward', () => {
    const byId = new Map(layoutLadder().map((p) => [p.id, p]));
    for (const rung of LADDER) {
      for (const dep of rung.deps) {
        expect(byId.get(rung.id)!.y, `${rung.id} below ${dep}`).toBeGreaterThan(byId.get(dep)!.y);
      }
    }
  });

  it('never stacks two rungs on the same spot', () => {
    const spots = layoutLadder().map((p) => `${p.x},${p.y}`);
    expect(new Set(spots).size).toBe(spots.length);
  });
});

describe('rungStandings', () => {
  it('opens the roots and locks everything with an uncleared prerequisite', () => {
    const standings = rungStandings(new Set());
    expect(standings.get('two-pointers')?.state).toBe('next');
    expect(standings.get('fast-slow-pointer')?.state).toBe('locked');
    expect(standings.get('fast-slow-pointer')?.blockedBy).toEqual(['two-pointers']);
  });

  it('unlocks a rung once its prerequisite anchors are solved, not the whole rung', () => {
    const cleared = new Set(slugsOf('two-pointers', 'anchor'));
    const standings = rungStandings(cleared);
    expect(standings.get('two-pointers')?.anchorsCleared).toBe(true);
    expect(standings.get('two-pointers')?.state).toBe('in-progress');
    expect(standings.get('fast-slow-pointer')?.state).toBe('next');
  });

  it('keeps a rung locked while any one prerequisite is still waiting', () => {
    const cleared = new Set(slugsOf('bfs', 'anchor'));
    const standing = rungStandings(cleared).get('topological-sort');
    expect(standing?.state).toBe('locked');
    expect(standing?.blockedBy).toEqual(['dfs']);
  });

  it('calls a rung complete only when every problem on it is solved', () => {
    const all = slugsOf('cyclic-sort');
    expect(rungStandings(new Set(all)).get('cyclic-sort')?.state).toBe('complete');
    expect(rungStandings(new Set(all.slice(0, -1))).get('cyclic-sort')?.state).toBe(
      'in-progress',
    );
  });

  it('counts a started rung as in progress even while its own deps are open', () => {
    // Locks are advice, so solving something on a locked rung is allowed and shown.
    const cleared = new Set(slugsOf('fast-slow-pointer').slice(0, 1));
    expect(rungStandings(cleared).get('fast-slow-pointer')?.state).toBe('in-progress');
  });
});
