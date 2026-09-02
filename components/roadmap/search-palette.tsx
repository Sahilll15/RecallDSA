'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Package, Search } from 'lucide-react';
import { PROJECT_TIERS, PROJECTS, TRACK_ORDER, TRACKS } from '@/lib/roadmap/catalog';
import type { Level, TrackId } from '@/lib/roadmap/types';
import { cn } from '@/lib/utils';
import { LevelMark } from './level-mark';

type Entry =
  | { kind: 'node'; track: TrackId; id: string; title: string; lv: Level; sub: string; hay: string }
  | { kind: 'project'; id: string; title: string; sub: string; hay: string };

const INDEX: Entry[] = [
  ...TRACK_ORDER.flatMap((tid) =>
    TRACKS[tid].nodes.map<Entry>((n) => ({
      kind: 'node',
      track: tid,
      id: n.id,
      title: n.t,
      lv: n.lv,
      sub: TRACKS[tid].name,
      hay: `${n.t} ${n.s} ${TRACKS[tid].name}`.toLowerCase(),
    })),
  ),
  ...PROJECTS.map<Entry>((p) => ({
    kind: 'project',
    id: p.id,
    title: p.name,
    sub: `${PROJECT_TIERS[p.tier].label} project`,
    hay: `${p.name} ${p.pitch}`.toLowerCase(),
  })),
];

interface SearchPaletteProps {
  onClose: () => void;
  onNode: (track: TrackId, nodeId: string) => void;
  onProject: () => void;
}

export function SearchPalette({ onClose, onNode, onProject }: SearchPaletteProps) {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return INDEX.filter((r) => r.kind === 'node').slice(0, 8);
    const starts: Entry[] = [];
    const includes: Entry[] = [];
    for (const r of INDEX) {
      if (r.title.toLowerCase().startsWith(query)) starts.push(r);
      else if (r.hay.includes(query)) includes.push(r);
    }
    return [...starts, ...includes].slice(0, 9);
  }, [q]);

  useEffect(() => {
    setIdx(0);
  }, [q]);

  const pick = (r: Entry) => {
    if (r.kind === 'node') onNode(r.track, r.id);
    else onProject();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[idx]) {
      e.preventDefault();
      pick(results[idx]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[85] flex items-start justify-center bg-background/70 px-5 pb-5 pt-[12vh] backdrop-blur-[3px] animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Search roadmaps"
        onClick={(e) => e.stopPropagation()}
        className="elevated-raised w-[560px] max-w-full overflow-hidden rounded-[var(--radius)] border border-border-strong bg-popover animate-scale-in"
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search topics and projects across every roadmap"
            aria-label="Search"
            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-1.5">
          {results.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nothing matches &quot;{q}&quot;. Try a broader term.
            </p>
          )}
          {results.map((r, i) => (
            <button
              key={`${r.kind}-${'track' in r ? r.track : ''}-${r.id}`}
              type="button"
              onMouseEnter={() => setIdx(i)}
              onClick={() => pick(r)}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
                i === idx ? 'bg-accent text-foreground' : 'text-foreground/90',
              )}
            >
              {r.kind === 'node' ? (
                <LevelMark level={r.lv} />
              ) : (
                <Package className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className="min-w-0 flex-1 truncate">
                {r.title}
                <span className="text-muted-foreground"> · {r.sub}</span>
              </span>
              <span className="rounded border border-border px-1.5 font-mono text-[0.625rem] uppercase tracking-wider text-muted-foreground">
                {r.kind === 'node' ? TRACKS[r.track].mono : 'project'}
              </span>
            </button>
          ))}
        </div>
        <div className="flex gap-4 border-t border-border px-4 py-2 text-[0.6875rem] text-muted-foreground">
          <span>
            <kbd className="rounded border border-border px-1 font-mono">↑↓</kbd> navigate
          </span>
          <span>
            <kbd className="rounded border border-border px-1 font-mono">Enter</kbd> jump
          </span>
          <span>
            <kbd className="rounded border border-border px-1 font-mono">Esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
