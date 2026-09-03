'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, CircleCheck, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { patternLabel } from '@/lib/constants';
import { TIER_LABELS, TIME_BUDGET_MIN, type LadderRung } from '@/lib/pattern-ladder';
import type { RungReadiness } from '@/lib/practice';
import { cn } from '@/lib/utils';
import { ReadinessChecklist, ReadinessPips } from './readiness-checklist';

const TIER_TONE: Record<string, string> = {
  anchor: 'text-info',
  rep: 'text-muted-foreground',
  twist: 'text-warning',
  boss: 'text-destructive',
};

export interface RungProgress {
  /** Slugs solved unaided, so a cleared problem reads as cleared. */
  cleared: string[];
  /** Slugs attempted but not yet solved unaided. */
  owed: string[];
}

export function RungCard({
  rung,
  readiness,
  progress,
}: {
  rung: LadderRung;
  readiness: RungReadiness;
  progress: RungProgress;
}) {
  const [open, setOpen] = useState(false);

  const cleared = new Set(progress.cleared);
  const owed = new Set(progress.owed);
  const next = readiness.nextProblem;

  return (
    <Card className={cn(readiness.ready && 'border-primary/30')}>
      <CardContent className="space-y-0 p-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-raised"
        >
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium">{rung.name}</span>
              {readiness.ready && (
                <Badge variant="success" className="shrink-0">
                  <CircleCheck className="h-3 w-3" />
                  Ready
                </Badge>
              )}
            </div>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <span data-numeric>
                {readiness.solvedUnaided}/{rung.problems.length} unaided
              </span>
              {/* Several rungs are named after their pattern; repeating it reads as a bug. */}
              {patternLabel(rung.corePattern) !== rung.name && (
                <>
                  <span aria-hidden>&middot;</span>
                  <span>{patternLabel(rung.corePattern)}</span>
                </>
              )}
            </p>
          </div>

          <ReadinessPips met={readiness.met} total={readiness.total} />
          <ChevronDown
            aria-hidden
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
              open && 'rotate-180',
            )}
          />
        </button>

        {open && (
          <div className="space-y-5 border-t border-border px-5 py-4">
            <div className="space-y-2">
              <p className="eyebrow">Ready when</p>
              <ReadinessChecklist checks={readiness.checks} />
            </div>

            <div className="space-y-2">
              <p className="eyebrow">The ladder</p>
              <ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
                {rung.problems.map((problem) => {
                  const isNext = next?.slug === problem.slug;
                  return (
                    <li
                      key={problem.slug}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 text-sm',
                        isNext && 'bg-primary-soft',
                      )}
                    >
                      <span
                        className={cn(
                          'w-14 shrink-0 font-mono text-[0.6875rem] uppercase tracking-wide',
                          TIER_TONE[problem.tier],
                        )}
                      >
                        {TIER_LABELS[problem.tier]}
                      </span>

                      <span
                        className={cn(
                          'min-w-0 flex-1 truncate',
                          cleared.has(problem.slug) && 'text-muted-foreground line-through',
                        )}
                      >
                        <span data-numeric className="text-muted-foreground">
                          {problem.number}.
                        </span>{' '}
                        {problem.title}
                      </span>

                      {owed.has(problem.slug) && (
                        <Badge variant="warning" className="shrink-0">
                          Owed
                        </Badge>
                      )}

                      <span className="hidden w-12 shrink-0 text-right font-mono text-[0.6875rem] text-muted-foreground sm:inline">
                        {TIME_BUDGET_MIN[problem.difficulty]}m
                      </span>

                      <Link
                        href={`/practice/solve/${problem.slug}`}
                        className="shrink-0 text-muted-foreground transition-colors hover:text-primary"
                        aria-label={`Start ${problem.title}`}
                      >
                        <Play className="h-3.5 w-3.5" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {next && (
              <Link href={`/practice/solve/${next.slug}`} className="block">
                <Button className="w-full">
                  Next: {next.title}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
