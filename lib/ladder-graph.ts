import { LADDER, type LadderRung } from './pattern-ladder';

/**
 * The ladder as a tree: prerequisite order, an automatic layout for the map,
 * and the unlock rule. Nothing here touches the database; the caller passes in
 * which problems are solved unaided and gets back where each rung stands.
 */

export interface RungPlacement {
  id: string;
  /** Longest path from a root, so a rung always sits below every prerequisite. */
  depth: number;
  x: number;
  y: number;
}

const NODE_W = 196;
const COL_GAP = 40;
const ROW_H = 150;
const PAD_X = 130;
const PAD_Y = 90;

const BY_ID = new Map(LADDER.map((rung) => [rung.id, rung]));

export function rungDepths(rungs: LadderRung[] = LADDER): Map<string, number> {
  const depths = new Map<string, number>();
  const visiting = new Set<string>();

  const depthOf = (id: string): number => {
    const cached = depths.get(id);
    if (cached !== undefined) return cached;
    // A cycle would recurse forever; treating the back-edge as a root keeps the
    // layout finite, and the catalog test asserts there are no cycles anyway.
    if (visiting.has(id)) return 0;
    visiting.add(id);
    const rung = BY_ID.get(id);
    const depth = rung && rung.deps.length > 0 ? 1 + Math.max(...rung.deps.map(depthOf)) : 0;
    visiting.delete(id);
    depths.set(id, depth);
    return depth;
  };

  for (const rung of rungs) depthOf(rung.id);
  return depths;
}

/** Dep ids that do not name a rung. Empty for a valid catalog. */
export function danglingDeps(rungs: LadderRung[] = LADDER): string[] {
  const ids = new Set(rungs.map((r) => r.id));
  return rungs.flatMap((r) => r.deps.filter((d) => !ids.has(d)).map((d) => `${r.id} -> ${d}`));
}

/** Rungs that reach themselves through deps. Empty for a valid catalog. */
export function cyclicRungs(rungs: LadderRung[] = LADDER): string[] {
  const byId = new Map(rungs.map((r) => [r.id, r]));
  const bad: string[] = [];
  for (const start of rungs) {
    const stack = [...start.deps];
    const seen = new Set<string>();
    while (stack.length > 0) {
      const id = stack.pop() as string;
      if (id === start.id) {
        bad.push(start.id);
        break;
      }
      if (seen.has(id)) continue;
      seen.add(id);
      stack.push(...(byId.get(id)?.deps ?? []));
    }
  }
  return bad;
}

/**
 * Rows by depth, ordered inside a row by the average column of the parents so
 * edges run mostly straight down. Two passes of that is enough for 37 nodes;
 * this is a study map, not a graph-drawing paper.
 */
export function layoutLadder(rungs: LadderRung[] = LADDER): RungPlacement[] {
  const depths = rungDepths(rungs);
  const rows = new Map<number, LadderRung[]>();
  for (const rung of rungs) {
    const depth = depths.get(rung.id) ?? 0;
    const row = rows.get(depth) ?? [];
    row.push(rung);
    rows.set(depth, row);
  }

  const maxDepth = Math.max(...rows.keys());
  const columns = new Map<string, number>();

  for (let depth = 0; depth <= maxDepth; depth += 1) {
    const row = rows.get(depth) ?? [];
    // Roots have no parents to follow, so they keep catalog order, which
    // already groups related rungs together.
    const keyed = row.map((rung, i) => {
      const parents = rung.deps.map((d) => columns.get(d)).filter((c) => c !== undefined) as number[];
      const bary = parents.length > 0 ? parents.reduce((a, b) => a + b, 0) / parents.length : i;
      return { rung, bary, i };
    });
    keyed.sort((a, b) => a.bary - b.bary || a.i - b.i);
    keyed.forEach(({ rung }, col) => columns.set(rung.id, col));
    rows.set(depth, keyed.map((k) => k.rung));
  }

  const widest = Math.max(...[...rows.values()].map((r) => r.length));
  const stageW = widest * (NODE_W + COL_GAP);

  const placements: RungPlacement[] = [];
  for (const [depth, row] of rows) {
    // Each row is centred, so a three-node row sits under the middle of a
    // seven-node row instead of hugging the left edge.
    const rowW = row.length * (NODE_W + COL_GAP);
    const offset = (stageW - rowW) / 2;
    row.forEach((rung, col) => {
      placements.push({
        id: rung.id,
        depth,
        x: PAD_X + offset + col * (NODE_W + COL_GAP) + NODE_W / 2,
        y: PAD_Y + depth * ROW_H,
      });
    });
  }
  return placements;
}

export type RungState = 'locked' | 'next' | 'in-progress' | 'complete';

export interface RungStanding {
  id: string;
  state: RungState;
  solvedUnaided: number;
  total: number;
  /** Every anchor-tier problem solved unaided: what the rungs below wait for. */
  anchorsCleared: boolean;
  /** Prerequisites still waiting on their anchors. Empty when unlocked. */
  blockedBy: string[];
}

function anchorsCleared(rung: LadderRung, cleared: Set<string>): boolean {
  const anchors = rung.problems.filter((p) => p.tier === 'anchor');
  return anchors.length > 0 && anchors.every((p) => cleared.has(p.slug));
}

/**
 * Where each rung stands given the set of slugs solved unaided. "Unaided" is
 * the input on purpose: a problem read from the editorial does not open the
 * rung below it, whatever the tick says.
 */
export function rungStandings(
  clearedSlugs: Set<string>,
  rungs: LadderRung[] = LADDER,
): Map<string, RungStanding> {
  const byId = new Map(rungs.map((r) => [r.id, r]));
  const standings = new Map<string, RungStanding>();

  for (const rung of rungs) {
    const solved = rung.problems.filter((p) => clearedSlugs.has(p.slug)).length;
    const blockedBy = rung.deps.filter((d) => {
      const dep = byId.get(d);
      return dep ? !anchorsCleared(dep, clearedSlugs) : false;
    });

    let state: RungState;
    if (solved === rung.problems.length) state = 'complete';
    else if (solved > 0) state = 'in-progress';
    else if (blockedBy.length > 0) state = 'locked';
    else state = 'next';

    standings.set(rung.id, {
      id: rung.id,
      state,
      solvedUnaided: solved,
      total: rung.problems.length,
      anchorsCleared: anchorsCleared(rung, clearedSlugs),
      blockedBy,
    });
  }
  return standings;
}
