'use client';

import Link from 'next/link';
import { ArrowRight, Crosshair, Flame, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ActivityDay } from '@/lib/activity';
import type { LadderDifficulty } from '@/lib/pattern-ladder';
import { cn } from '@/lib/utils';

export interface PracticePanelData {
  solvedUnaided: number;
  totalProblems: number;
  byDifficulty: Record<LadderDifficulty, { solved: number; total: number }>;
  rungsComplete: number;
  rungsReady: number;
  rungsTotal: number;
  recognitionRate: number | null;
  diagnosticsSeen: number;
  openDebts: number;
  /** The last twelve weeks, oldest first. */
  activity: ActivityDay[];
  currentStreak: number;
  longestStreak: number;
}

const DIFFICULTY_TONE: Record<LadderDifficulty, string> = {
  easy: 'text-primary',
  medium: 'text-warning',
  hard: 'text-destructive',
};

const HEAT = ['bg-calendar-empty', 'bg-primary/30', 'bg-primary/55', 'bg-primary/80', 'bg-primary'];

/**
 * The instrument panel beside the practice tree: how much of the ladder is
 * solved, split by difficulty, plus the habit reading. Mirrors the roadmap's
 * panel so the two maps feel like one app.
 */
export function PracticePanel({ data }: { data: PracticePanelData }) {
  const pct = data.totalProblems > 0 ? data.solvedUnaided / data.totalProblems : 0;
  const R = 52;
  const C = 2 * Math.PI * R;

  return (
    <aside className="elevated flex flex-col divide-y divide-border rounded-[var(--radius)] border border-border bg-surface">
      <div className="flex items-center gap-4 p-4">
        <div className="relative h-[118px] w-[118px] shrink-0">
          <svg width="118" height="118" className="-rotate-90" aria-hidden>
            <circle cx="59" cy="59" r={R} fill="none" strokeWidth="9" className="stroke-muted" />
            <circle
              cx="59"
              cy="59"
              r={R}
              fill="none"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct)}
              className="stroke-primary transition-[stroke-dashoffset] duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span data-numeric className="font-display text-3xl font-semibold leading-none">
              {data.solvedUnaided}
            </span>
            <span className="mt-1 text-[0.6875rem] text-muted-foreground" data-numeric>
              of {data.totalProblems}
            </span>
            <span className="text-[0.6875rem] text-muted-foreground">solved</span>
          </div>
        </div>

        <dl className="flex-1 space-y-2">
          {(['easy', 'medium', 'hard'] as LadderDifficulty[]).map((level) => {
            const row = data.byDifficulty[level];
            const share = row.total > 0 ? (row.solved / row.total) * 100 : 0;
            return (
              <div key={level} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <dt className={cn('font-mono capitalize', DIFFICULTY_TONE[level])}>{level}</dt>
                  <dd data-numeric className="font-mono text-muted-foreground">
                    {row.solved}/{row.total}
                  </dd>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500"
                    style={{ width: `${share}%` }}
                  />
                </div>
              </div>
            );
          })}
        </dl>
      </div>

      <div className="grid grid-cols-2 divide-x divide-y divide-border">
        {[
          {
            label: 'Rungs complete',
            value: `${data.rungsComplete}/${data.rungsTotal}`,
            sub: `${data.rungsReady} pass every check`,
          },
          {
            label: 'Blind recognition',
            value: data.recognitionRate === null ? '--' : `${data.recognitionRate}%`,
            sub:
              data.diagnosticsSeen === 0
                ? 'no statements yet'
                : `${data.diagnosticsSeen} statements`,
          },
          {
            label: 'Re-derives owed',
            value: data.openDebts,
            sub: data.openDebts === 0 ? 'nothing owed' : 'read, not derived',
            tone: data.openDebts > 0 ? 'text-warning' : undefined,
          },
          {
            label: 'Best streak',
            value: `${data.longestStreak}d`,
            sub: 'days in a row',
          },
        ].map((s, i) => (
          <div key={s.label} className={cn('px-4 py-3', i < 2 && '!border-t-0')}>
            <p className="text-[0.6875rem] text-muted-foreground">{s.label}</p>
            <p data-numeric className={cn('font-display text-xl font-semibold leading-tight', s.tone)}>
              {s.value}
            </p>
            <p className="text-[0.6875rem] text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Last twelve weeks</p>
          <p
            className={cn(
              'flex items-center gap-1 font-mono text-xs',
              data.currentStreak > 0 ? 'text-warning' : 'text-muted-foreground',
            )}
            data-numeric
          >
            {data.currentStreak > 0 ? (
              <Flame className="h-3.5 w-3.5" />
            ) : (
              <Trophy className="h-3.5 w-3.5" />
            )}
            {data.currentStreak} day streak
          </p>
        </div>
        <div
          className="grid grid-flow-col grid-rows-7 gap-[3px]"
          role="img"
          aria-label={`${data.activity.filter((d) => d.count > 0).length} active days in the last twelve weeks`}
        >
          {data.activity.map((day) => (
            <span
              key={day.date}
              title={`${day.date}: ${day.count}`}
              className={cn('h-[9px] w-[9px] rounded-[2px]', HEAT[day.level])}
            />
          ))}
        </div>
      </div>

      <div className="p-4">
        <Link href="/practice/diagnostic" className="block">
          <Button variant="outline" className="w-full">
            <Crosshair className="h-4 w-4" />
            Run a blind diagnostic
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <p className="mt-2 text-[0.6875rem] leading-relaxed text-muted-foreground">
          Ten statements, topic hidden, a minute each. The only recognition reading taken on
          problems you have never seen.
        </p>
      </div>
    </aside>
  );
}
