'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, Lock } from 'lucide-react';
import { edgesOf, layerNodes, lineage } from '@/lib/dag-layout';
import { cn } from '@/lib/utils';

/**
 * A prerequisite graph drawn as rows on a normal page. Every node is a real
 * button at body size, so the map reads without panning or zooming; edges are
 * an SVG overlay measured from the rendered nodes. Hovering or selecting a node
 * lights its lineage and steps everything else back, which is how 37 nodes
 * stay legible without hiding any of them.
 */

export type DagState = 'locked' | 'next' | 'active' | 'done';

export interface DagNode {
  id: string;
  deps: string[];
  title: string;
  /** Left-hand reading under the title: "3 of 7 solved", "~14h". */
  meta: string;
  /** Right-hand reading: a level mark, a count, anything small. */
  aside?: ReactNode;
  state: DagState;
  /** 0 to 1. The bar under the title. */
  progress: number;
  /** Set when the edge INTO this node's children should read as open. */
  opensNext?: boolean;
}

interface DagMapProps {
  nodes: DagNode[];
  selected: string | null;
  onSelect: (id: string) => void;
  /** Changes whenever a node should be scrolled into view. */
  focus?: { id: string; n: number } | null;
  className?: string;
  /** Rendered in the top-left corner over the map. */
  legend?: ReactNode;
}

interface Edge {
  id: string;
  from: string;
  to: string;
  d: string;
}

export function DagMap({ nodes, selected, onSelect, focus, className, legend }: DagMapProps) {
  const { rows } = useMemo(() => layerNodes(nodes), [nodes]);
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const pairs = useMemo(() => edgesOf(nodes), [nodes]);

  const wrapRef = useRef<HTMLDivElement>(null);
  const nodeEls = useRef<Record<string, HTMLButtonElement | null>>({});
  const [edges, setEdges] = useState<Edge[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);

  const focusId = hovered ?? selected;
  const lit = useMemo(() => (focusId ? lineage(nodes, focusId) : null), [nodes, focusId]);

  // Edges leave the bottom centre of a parent and land on the top centre of a
  // child. Measured from the DOM so a two-line title still meets the card edge.
  const computeEdges = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const origin = wrap.getBoundingClientRect();
    const list: Edge[] = [];
    for (const [from, to] of pairs) {
      const p = nodeEls.current[from];
      const c = nodeEls.current[to];
      if (!p || !c) continue;
      const pr = p.getBoundingClientRect();
      const cr = c.getBoundingClientRect();
      const px = pr.left - origin.left + pr.width / 2;
      const py = pr.bottom - origin.top;
      const cx = cr.left - origin.left + cr.width / 2;
      const cy = cr.top - origin.top;
      const dy = cy - py;
      list.push({
        id: `${from}-${to}`,
        from,
        to,
        d: `M ${px} ${py} C ${px} ${py + dy * 0.5}, ${cx} ${cy - dy * 0.5}, ${cx} ${cy}`,
      });
    }
    setEdges(list);
  }, [pairs]);

  useLayoutEffect(() => {
    computeEdges();
  }, [computeEdges, rows]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => computeEdges());
    ro.observe(wrap);
    if (document.fonts?.ready) document.fonts.ready.then(computeEdges);
    return () => ro.disconnect();
  }, [computeEdges]);

  useEffect(() => {
    if (!focus) return;
    const el = nodeEls.current[focus.id];
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el?.focus({ preventScroll: true });
  }, [focus]);

  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(([entry]) => {
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      className={cn(
        'dag elevated overflow-hidden rounded-[var(--radius)] border border-border bg-surface',
        lit && 'focused',
        className,
      )}
      onMouseLeave={() => setHovered(null)}
    >
      <svg className="dag-edges" width={size.w} height={size.h} aria-hidden>
        {edges.map((e) => (
          <path
            key={e.id}
            d={e.d}
            className={cn(
              byId.get(e.from)?.opensNext && 'open',
              lit && lit.has(e.from) && lit.has(e.to) && 'lit',
            )}
          />
        ))}
      </svg>

      {legend && <div className="relative z-[1] px-4 pt-3">{legend}</div>}

      <div className="relative z-[1] py-2">
        {rows.map((row, depth) => (
          <div key={depth} className="dag-row">
            {row.map((id) => {
              const node = byId.get(id);
              if (!node) return null;
              const isLit = !lit || lit.has(id);
              return (
                <button
                  key={id}
                  type="button"
                  ref={(el) => {
                    nodeEls.current[id] = el;
                  }}
                  className={cn(
                    'dag-node',
                    node.state,
                    selected === id && 'selected',
                    isLit && 'lit',
                  )}
                  onClick={() => onSelect(id)}
                  onMouseEnter={() => setHovered(id)}
                  onFocus={() => setHovered(id)}
                  onBlur={() => setHovered(null)}
                  aria-pressed={selected === id}
                  aria-label={`${node.title}, ${node.meta}${node.state === 'locked' ? ', waiting on a prerequisite' : ''}`}
                >
                  {node.state === 'done' && (
                    <span className="dag-node-check" aria-hidden>
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  )}
                  <span className="dag-node-title">{node.title}</span>
                  <span className="dag-node-meta">
                    <span className="flex items-center gap-1.5">
                      {node.state === 'locked' && <Lock className="h-3 w-3 shrink-0" aria-hidden />}
                      <span data-numeric>{node.meta}</span>
                    </span>
                    {node.aside}
                  </span>
                  <span className="dag-node-bar" aria-hidden>
                    <i style={{ width: `${Math.round(node.progress * 100)}%` }} />
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
