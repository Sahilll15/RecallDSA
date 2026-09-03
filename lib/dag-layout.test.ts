import { describe, expect, it } from 'vitest';
import { LADDER } from './pattern-ladder';
import { TRACKS, TRACK_ORDER } from './roadmap/catalog';
import { edgesOf, layerNodes, lineage, type DagInput } from './dag-layout';

const diamond: DagInput[] = [
  { id: 'a', deps: [] },
  { id: 'b', deps: ['a'] },
  { id: 'c', deps: ['a'] },
  { id: 'd', deps: ['b', 'c'] },
  { id: 'e', deps: [] },
];

describe('layerNodes', () => {
  it('puts roots on the first row and every node below all its prerequisites', () => {
    const { depth, rows } = layerNodes(diamond);
    expect(rows[0]).toEqual(['a', 'e']);
    expect(depth.get('d')).toBe(2);
    for (const node of diamond) {
      for (const dep of node.deps) {
        expect(depth.get(node.id)!).toBeGreaterThan(depth.get(dep)!);
      }
    }
  });

  it('places every node exactly once', () => {
    for (const source of [LADDER, ...TRACK_ORDER.map((t) => TRACKS[t].nodes)]) {
      const { rows } = layerNodes(source);
      const flat = rows.flat();
      expect(flat).toHaveLength(source.length);
      expect(new Set(flat).size).toBe(source.length);
    }
  });

  it('keeps a child under its parents rather than at the far edge', () => {
    // Two roots far apart; the shared child should sit between them.
    const wide: DagInput[] = [
      { id: 'l', deps: [] },
      { id: 'm1', deps: [] },
      { id: 'm2', deps: [] },
      { id: 'r', deps: [] },
      { id: 'lc', deps: ['l'] },
      { id: 'rc', deps: ['r'] },
      { id: 'mid', deps: ['l', 'r'] },
    ];
    const { rows } = layerNodes(wide);
    expect(rows[1]).toEqual(['lc', 'mid', 'rc']);
  });

  it('ignores a dep that names nothing in the set', () => {
    const { depth } = layerNodes([{ id: 'x', deps: ['ghost'] }]);
    expect(depth.get('x')).toBe(0);
  });

  it('survives a cycle instead of recursing forever', () => {
    expect(() =>
      layerNodes([
        { id: 'a', deps: ['b'] },
        { id: 'b', deps: ['a'] },
      ]),
    ).not.toThrow();
  });

  it('handles an empty graph', () => {
    expect(layerNodes([]).rows).toEqual([]);
  });
});

describe('lineage', () => {
  it('collects ancestors, descendants and the node itself', () => {
    expect([...lineage(diamond, 'b')].sort()).toEqual(['a', 'b', 'd']);
    expect([...lineage(diamond, 'a')].sort()).toEqual(['a', 'b', 'c', 'd']);
    expect([...lineage(diamond, 'e')]).toEqual(['e']);
  });

  it('follows a chain all the way in both directions', () => {
    const family = lineage(LADDER, 'dp-lis');
    expect(family.has('tree-level-order')).toBe(true);
    expect(family.has('dp-partition')).toBe(true);
    expect(family.has('cyclic-sort')).toBe(false);
  });
});

describe('edgesOf', () => {
  it('returns one edge per valid dep', () => {
    expect(edgesOf(diamond)).toEqual([
      ['a', 'b'],
      ['a', 'c'],
      ['b', 'd'],
      ['c', 'd'],
    ]);
  });
});
