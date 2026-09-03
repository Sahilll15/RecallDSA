/**
 * Layered layout for a small prerequisite graph, shared by the practice ladder
 * and the learning roadmap. Rows by depth, ordered inside a row so edges run
 * mostly straight down. No coordinates: the map renders rows as a CSS grid and
 * measures edges from the DOM, so the page scrolls like every other page.
 */

export interface DagInput {
  id: string;
  deps: string[];
}

export interface Layered {
  /** Row index by node id. A node is always below every prerequisite. */
  depth: Map<string, number>;
  /** Node ids per row, in display order. */
  rows: string[][];
}

export function layerNodes(nodes: DagInput[]): Layered {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const depth = new Map<string, number>();
  const visiting = new Set<string>();

  const depthOf = (id: string): number => {
    const cached = depth.get(id);
    if (cached !== undefined) return cached;
    // A cycle would recurse forever; treating the back-edge as a root keeps the
    // layout finite. Catalog tests assert there are none.
    if (visiting.has(id)) return 0;
    visiting.add(id);
    const node = byId.get(id);
    const deps = node?.deps.filter((d) => byId.has(d)) ?? [];
    const d = deps.length > 0 ? 1 + Math.max(...deps.map(depthOf)) : 0;
    visiting.delete(id);
    depth.set(id, d);
    return d;
  };
  for (const node of nodes) depthOf(node.id);

  const grouped = new Map<number, DagInput[]>();
  for (const node of nodes) {
    const d = depth.get(node.id) ?? 0;
    const row = grouped.get(d) ?? [];
    row.push(node);
    grouped.set(d, row);
  }

  const maxDepth = grouped.size > 0 ? Math.max(...grouped.keys()) : -1;
  const column = new Map<string, number>();
  const rows: string[][] = [];

  for (let d = 0; d <= maxDepth; d += 1) {
    const row = grouped.get(d) ?? [];
    // Roots keep input order, which the catalogs already write in a sensible
    // sequence. Everything else follows the average column of its parents.
    const keyed = row.map((node, i) => {
      const parents = node.deps
        .map((p) => column.get(p))
        .filter((c): c is number => c !== undefined);
      const bary = parents.length > 0 ? parents.reduce((a, b) => a + b, 0) / parents.length : i;
      return { id: node.id, bary, i };
    });
    keyed.sort((a, b) => a.bary - b.bary || a.i - b.i);
    keyed.forEach((k, col) => column.set(k.id, col));
    rows.push(keyed.map((k) => k.id));
  }

  return { depth, rows };
}

/**
 * Everything upstream and downstream of one node, plus the node itself. This
 * is what lights up on hover: the path you took to get here and what it opens.
 */
export function lineage(nodes: DagInput[], id: string): Set<string> {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const children = new Map<string, string[]>();
  for (const node of nodes) {
    for (const dep of node.deps) {
      const list = children.get(dep) ?? [];
      list.push(node.id);
      children.set(dep, list);
    }
  }

  const out = new Set<string>([id]);
  const up = [id];
  while (up.length > 0) {
    const cur = up.pop() as string;
    for (const dep of byId.get(cur)?.deps ?? []) {
      if (!out.has(dep)) {
        out.add(dep);
        up.push(dep);
      }
    }
  }
  const down = [id];
  while (down.length > 0) {
    const cur = down.pop() as string;
    for (const child of children.get(cur) ?? []) {
      if (!out.has(child)) {
        out.add(child);
        down.push(child);
      }
    }
  }
  return out;
}

/** Edges as [from, to] pairs, skipping deps that name nothing in the set. */
export function edgesOf(nodes: DagInput[]): Array<[string, string]> {
  const ids = new Set(nodes.map((n) => n.id));
  const out: Array<[string, string]> = [];
  for (const node of nodes) {
    for (const dep of node.deps) if (ids.has(dep)) out.push([dep, node.id]);
  }
  return out;
}
