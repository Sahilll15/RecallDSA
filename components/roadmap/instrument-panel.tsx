'use client';

import { useMemo, useRef } from 'react';
import { ChevronDown, Crosshair, Download, RotateCcw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  LEVEL_ORDER,
  LEVELS,
  TRACK_ORDER,
  TRACKS,
  type TrackWithMono,
} from '@/lib/roadmap/catalog';
import {
  computeStreaks,
  localDay,
  summarizeTrack,
  type RoadmapProgress,
} from '@/lib/roadmap/progress';
import type { TrackId } from '@/lib/roadmap/types';
import { cn } from '@/lib/utils';
import { LEVEL_BG } from './level-mark';

interface InstrumentPanelProps {
  track: TrackWithMono;
  trackId: TrackId;
  done: Record<string, true>;
  activity: RoadmapProgress['activity'];
  onSelectTrack: (id: TrackId) => void;
  onFit: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
}

const HEAT_FILL = ['bg-calendar-empty', 'bg-primary/35', 'bg-primary/65', 'bg-primary'] as const;

/** Last 12 weeks of completions, columns as weeks, matching the dashboard calendar. */
function ActivityStrip({ activity }: { activity: RoadmapProgress['activity'] }) {
  const cells = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - (83 + today.getDay()));
    const out: Array<{ key: string; n: number }> = [];
    for (let i = 0; i < 84 + today.getDay() + 1; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      if (d > today) break;
      const key = localDay(d);
      out.push({ key, n: activity[key] || 0 });
    }
    return out;
  }, [activity]);

  return (
    <div
      className="grid grid-flow-col grid-rows-7 gap-[3px] overflow-hidden"
      title="Completions per day, last 12 weeks"
    >
      {cells.map((c) => (
        <span
          key={c.key}
          title={`${c.key}: ${c.n}`}
          className={cn(
            'h-[9px] w-[9px] rounded-[2px]',
            HEAT_FILL[c.n > 2 ? 3 : c.n > 1 ? 2 : c.n > 0 ? 1 : 0],
          )}
        />
      ))}
    </div>
  );
}

export function InstrumentPanel({
  track,
  trackId,
  done,
  activity,
  onSelectTrack,
  onFit,
  onExport,
  onImport,
  onReset,
}: InstrumentPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const sum = summarizeTrack(track, done);
  const streaks = useMemo(() => computeStreaks(activity), [activity]);
  const byLevel = LEVEL_ORDER.map((lv) => {
    const all = track.nodes.filter((n) => n.lv === lv);
    return {
      lv,
      label: LEVELS[lv].label,
      done: all.filter((n) => done[n.id]).length,
      total: all.length,
    };
  });

  const R = 52;
  const C = 2 * Math.PI * R;
  const weeksLeft = Math.max(1, Math.ceil((sum.totalHours - sum.doneHours) / 10));

  return (
    <aside className="elevated flex flex-col divide-y divide-border rounded-[var(--radius)] border border-border bg-surface">
      <div className="space-y-3 p-4">
        <p className="eyebrow">Roadmap</p>
        <div className="relative">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 rounded border border-border bg-surface-raised px-1.5 font-mono text-[0.625rem] font-semibold tracking-wider text-muted-foreground">
            {track.mono}
          </span>
          <select
            aria-label="Select roadmap"
            value={trackId}
            onChange={(e) => onSelectTrack(e.target.value as TrackId)}
            className="h-10 w-full appearance-none rounded-[var(--radius)] border border-input bg-background pl-12 pr-9 font-display text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {TRACK_ORDER.map((id) => (
              <option key={id} value={id}>
                {TRACKS[id].name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{track.blurb}</p>
      </div>

      <div className="flex items-center gap-4 p-4">
        <div className="relative h-[118px] w-[118px] shrink-0">
          <svg width="118" height="118" className="-rotate-90">
            <circle cx="59" cy="59" r={R} fill="none" strokeWidth="9" className="stroke-muted" />
            <circle
              cx="59"
              cy="59"
              r={R}
              fill="none"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - sum.pct / 100)}
              className="stroke-primary transition-[stroke-dashoffset] duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-2xl font-semibold leading-none" data-numeric>
              {sum.pct}
              <span className="text-sm">%</span>
            </span>
            <span className="mt-1 font-mono text-[0.625rem] text-muted-foreground" data-numeric>
              {sum.done}/{sum.total} done
            </span>
          </div>
        </div>
        <div className="flex-1 space-y-2.5">
          {byLevel.map((r) => (
            <div key={r.lv} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-mono text-muted-foreground" data-numeric>
                  {r.done}/{r.total}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full rounded-full transition-[width] duration-500', LEVEL_BG[r.lv])}
                  style={{ width: `${r.total ? (r.done / r.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-y divide-border">
        {[
          { label: 'Hours done', value: sum.doneHours, unit: `/${sum.totalHours}h` },
          { label: 'Left at 10h/wk', value: `~${weeksLeft}`, unit: ' wk' },
          {
            label: 'Current streak',
            value: streaks.current,
            unit: streaks.current === 1 ? ' day' : ' days',
            hot: streaks.current > 0,
          },
          { label: 'Best streak', value: streaks.best, unit: streaks.best === 1 ? ' day' : ' days' },
        ].map((s, i) => (
          <div key={s.label} className={cn('px-4 py-3', i < 2 && '!border-t-0')}>
            <p
              className={cn('font-display text-xl font-semibold leading-none', s.hot && 'text-warning')}
              data-numeric
            >
              {s.value}
              <span className="text-xs font-normal text-muted-foreground">{s.unit}</span>
            </p>
            <p className="mt-1 text-[0.6875rem] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="p-4">
        <ActivityStrip activity={activity} />
      </div>

      <div className="flex items-center justify-between gap-1 p-2">
        <Button type="button" variant="ghost" size="icon" onClick={onFit} title="Fit to screen">
          <Crosshair className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={onExport} title="Export progress as JSON">
          <Download className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileRef.current?.click()}
          title="Import progress from JSON"
        >
          <Upload className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onReset}
          title="Reset this roadmap"
          className="text-muted-foreground hover:text-destructive"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImport(f);
            e.target.value = '';
          }}
        />
      </div>
    </aside>
  );
}
