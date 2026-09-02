'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Check, Crosshair, Minus, Plus } from 'lucide-react';
import type { TrackWithMono } from '@/lib/roadmap/catalog';
import { isNextNode, noteKey, type RoadmapProgress } from '@/lib/roadmap/progress';
import type { TrackId } from '@/lib/roadmap/types';
import { cn } from '@/lib/utils';
import { InstrumentPanel } from './instrument-panel';
import { LevelMark } from './level-mark';
import { NodeDrawer } from './node-drawer';

export interface FocusRequest {
  track: TrackId;
  node: string;
  /** Changes on every request so the same node can be re-focused. */
  n: number;
}

interface MapViewProps {
  track: TrackWithMono;
  trackId: TrackId;
  progress: RoadmapProgress;
  selected: string | null;
  focus: FocusRequest | null;
  onSelect: (nodeId: string | null) => void;
  onSelectTrack: (id: TrackId) => void;
  onToggleNode: (trackId: TrackId, nodeId: string) => void;
  onNote: (trackId: TrackId, nodeId: string, text: string) => void;
  onReset: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

interface Transform {
  k: number;
  x: number;
  y: number;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const MIN_K = 0.28;
const MAX_K = 2.4;
const DRAWER_W = 400;

export function MapView({
  track,
  trackId,
  progress,
  selected,
  focus,
  onSelect,
  onSelectTrack,
  onToggleNode,
  onNote,
  onReset,
  onExport,
  onImport,
}: MapViewProps) {
  const done = progress.tracks[trackId]?.done || {};
  const wrapRef = useRef<HTMLDivElement>(null);
  const nodeEls = useRef<Record<string, HTMLButtonElement | null>>({});
  const [edges, setEdges] = useState<Array<{ id: string; d: string; child: string }>>([]);
  const [t, setT] = useState<Transform>({ k: 0.8, x: 0, y: 0 });
  const tRef = useRef(t);
  const pan = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const [grabbing, setGrabbing] = useState(false);
  const [smooth, setSmooth] = useState(false);
  const smoothTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const glide = useCallback(() => {
    setSmooth(true);
    if (smoothTimer.current) clearTimeout(smoothTimer.current);
    smoothTimer.current = setTimeout(() => setSmooth(false), 580);
  }, []);

  const setTransform = useCallback((next: Transform) => {
    tRef.current = next;
    setT(next);
  }, []);

  const stageSize = useMemo(() => {
    const xs = track.nodes.map((n) => n.x);
    const ys = track.nodes.map((n) => n.y);
    return { w: Math.max(...xs) + 200, h: Math.max(...ys) + 160 };
  }, [track]);

  // Edges are measured from the rendered nodes so a taller title still meets the card edge.
  const computeEdges = useCallback(() => {
    const list: Array<{ id: string; d: string; child: string }> = [];
    for (const node of track.nodes) {
      const c = nodeEls.current[node.id];
      if (!c) continue;
      const cx = c.offsetLeft;
      const cy = c.offsetTop - c.offsetHeight / 2;
      for (const dep of node.deps) {
        const p = nodeEls.current[dep];
        if (!p) continue;
        const px = p.offsetLeft;
        const py = p.offsetTop + p.offsetHeight / 2;
        const dy = cy - py;
        const d = `M ${px} ${py} C ${px} ${py + dy * 0.5}, ${cx} ${cy - dy * 0.5}, ${cx} ${cy}`;
        list.push({ id: `${dep}-${node.id}`, d, child: node.id });
      }
    }
    setEdges(list);
  }, [track]);

  const fit = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const xs = track.nodes.map((n) => n.x);
    const ys = track.nodes.map((n) => n.y);
    const minX = Math.min(...xs) - 130;
    const maxX = Math.max(...xs) + 130;
    const minY = Math.min(...ys) - 80;
    const maxY = Math.max(...ys) + 90;
    const w = maxX - minX;
    const h = maxY - minY;
    const k = clamp(Math.min(rect.width / w, rect.height / h), 0.32, 1.25);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    glide();
    setTransform({ k, x: rect.width / 2 - cx * k, y: rect.height / 2 - cy * k });
  }, [track, setTransform, glide]);

  useLayoutEffect(() => {
    computeEdges();
  }, [computeEdges]);

  useEffect(() => {
    fit();
    const t1 = setTimeout(computeEdges, 250);
    if (document.fonts?.ready) document.fonts.ready.then(computeEdges);
    window.addEventListener('resize', fit);
    return () => {
      clearTimeout(t1);
      window.removeEventListener('resize', fit);
    };
    // Re-run only when the track changes; fit/computeEdges are stable per track.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackId]);

  useEffect(() => {
    if (!focus || focus.track !== trackId) return;
    const node = track.nodes.find((n) => n.id === focus.node);
    const wrap = wrapRef.current;
    if (!node || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    // The drawer covers the right edge on wide screens; centre in what remains.
    const drawerPad = window.innerWidth > 900 ? Math.min(DRAWER_W, rect.width * 0.4) : 0;
    const k = Math.max(tRef.current.k, 0.95);
    glide();
    setTransform({
      k,
      x: (rect.width - drawerPad) / 2 - node.x * k,
      y: rect.height / 2 - node.y * k,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, trackId]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setSmooth(false);
      const rect = wrap.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const cur = tRef.current;
      const k = clamp(cur.k * Math.exp(-e.deltaY * 0.0016), MIN_K, MAX_K);
      setTransform({
        k,
        x: mx - (mx - cur.x) * (k / cur.k),
        y: my - (my - cur.y) * (k / cur.k),
      });
    };
    wrap.addEventListener('wheel', onWheel, { passive: false });
    return () => wrap.removeEventListener('wheel', onWheel);
  }, [setTransform]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.rm-node')) return;
    setSmooth(false);
    pan.current = { sx: e.clientX, sy: e.clientY, ox: tRef.current.x, oy: tRef.current.y };
    setGrabbing(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pan.current) return;
    const c = tRef.current;
    setTransform({
      k: c.k,
      x: pan.current.ox + (e.clientX - pan.current.sx),
      y: pan.current.oy + (e.clientY - pan.current.sy),
    });
  };
  const endPan = () => {
    pan.current = null;
    setGrabbing(false);
  };

  const zoomBy = (f: number) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const mx = rect.width / 2;
    const my = rect.height / 2;
    const cur = tRef.current;
    const k = clamp(cur.k * f, MIN_K, MAX_K);
    glide();
    setTransform({ k, x: mx - (mx - cur.x) * (k / cur.k), y: my - (my - cur.y) * (k / cur.k) });
  };

  const selectedNode = selected ? track.nodes.find((n) => n.id === selected) || null : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="elevated relative h-[68vh] min-h-[520px] overflow-hidden rounded-[var(--radius)] border border-border bg-surface">
        <div
          ref={wrapRef}
          className={cn('rm-stage-wrap', grabbing && 'grabbing')}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPan}
          onPointerLeave={endPan}
          onPointerCancel={endPan}
        >
          <div
            className={cn('rm-stage', smooth && 'smooth')}
            style={{
              width: stageSize.w,
              height: stageSize.h,
              transform: `translate(${t.x}px,${t.y}px) scale(${t.k})`,
            }}
          >
            <svg className="rm-edges" width={stageSize.w} height={stageSize.h}>
              {edges.map((e) => (
                <path key={e.id} d={e.d} className={done[e.child] ? 'done' : undefined} />
              ))}
            </svg>
            {track.nodes.map((node, idx) => {
              const isDone = !!done[node.id];
              return (
                <button
                  key={node.id}
                  type="button"
                  ref={(el) => {
                    nodeEls.current[node.id] = el;
                  }}
                  className={cn(
                    'rm-node',
                    isDone && 'done',
                    !isDone && isNextNode(node, done) && 'next',
                    selected === node.id && 'selected',
                  )}
                  style={{ left: node.x, top: node.y, ['--i' as string]: idx }}
                  onClick={() => onSelect(node.id)}
                  aria-pressed={selected === node.id}
                >
                  <span className="rm-node-check">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span className="mb-1.5 flex items-center justify-between gap-2">
                    <LevelMark level={node.lv} />
                    <span className="font-mono text-[0.625rem] tracking-wide text-muted-foreground" data-numeric>
                      ~{node.h}h
                    </span>
                  </span>
                  <span className="block font-display text-[0.8438rem] font-semibold leading-tight tracking-tight">
                    {node.t}
                  </span>
                  <span className="rm-node-bar">
                    <i />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-border bg-surface/80 px-3 py-1.5 text-[0.6875rem] text-muted-foreground backdrop-blur">
          <b className="font-semibold text-foreground/80">Drag</b> to pan · <b className="font-semibold text-foreground/80">Scroll</b> to zoom · <b className="font-semibold text-foreground/80">Click</b> a node
        </div>
        <div className="elevated absolute bottom-3 left-3 flex flex-col gap-0.5 rounded-[var(--radius)] border border-border bg-surface p-1">
          {[
            { title: 'Zoom in', icon: Plus, fn: () => zoomBy(1.25) },
            { title: 'Zoom out', icon: Minus, fn: () => zoomBy(0.8) },
            { title: 'Fit to screen', icon: Crosshair, fn: fit },
          ].map((b) => (
            <button
              key={b.title}
              type="button"
              title={b.title}
              onClick={b.fn}
              className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <b.icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      <InstrumentPanel
        track={track}
        trackId={trackId}
        done={done}
        activity={progress.activity}
        onSelectTrack={onSelectTrack}
        onFit={fit}
        onExport={onExport}
        onImport={onImport}
        onReset={onReset}
      />

      <NodeDrawer
        node={selectedNode}
        done={selectedNode ? !!done[selectedNode.id] : false}
        note={selectedNode ? progress.notes[noteKey(trackId, selectedNode.id)] || '' : ''}
        onNote={(text) => selectedNode && onNote(trackId, selectedNode.id, text)}
        onClose={() => onSelect(null)}
        onToggle={() => selectedNode && onToggleNode(trackId, selectedNode.id)}
      />
    </div>
  );
}
