'use client';

import Link from 'next/link';
import { ArrowRight, ListChecks } from 'lucide-react';
import {
  AnimatedCard,
  AnimatedCardContent,
  AnimatedCardDescription,
  AnimatedCardHeader,
} from '@/components/ui/animated-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ReadinessPips } from './readiness-checklist';

export interface PracticeSummary {
  rungsReady: number;
  rungsTotal: number;
  solvedUnaided: number;
  attempted: number;
  openDebts: number;
  recognitionRate: number | null;
  diagnosticsSeen: number;
  /** The rung closest to ready, so the tile points at one action. */
  focus: { name: string; met: number; total: number; nextTitle: string; slug: string } | null;
}

/** Dashboard summary of the forward half: first solves, not recall. */
export function PracticeTile({
  summary,
  delay = 0,
}: {
  summary: PracticeSummary;
  delay?: number;
}) {
  const started = summary.attempted > 0 || summary.diagnosticsSeen > 0;

  return (
    <AnimatedCard delay={delay}>
      <AnimatedCardHeader>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="eyebrow flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5 text-primary" />
              Practice ladder
            </p>
            <AnimatedCardDescription>
              {started
                ? `${summary.rungsReady} of ${summary.rungsTotal} patterns pass every readiness check`
                : '188 problems you have not solved yet, tiered by pattern. Nothing attempted.'}
            </AnimatedCardDescription>
          </div>
          <Link href="/practice">
            <Button size="sm" variant="outline" className="group">
              Open practice
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </AnimatedCardHeader>

      {started && (
        <AnimatedCardContent>
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="space-y-1">
              <p className="eyebrow">Solved unaided</p>
              <p data-numeric className="font-display text-2xl font-semibold">
                {summary.solvedUnaided}
                <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                  of {summary.attempted} attempted
                </span>
              </p>
              {summary.openDebts > 0 && (
                <Badge variant="warning">
                  {summary.openDebts} re-derive{summary.openDebts === 1 ? '' : 's'} owed
                </Badge>
              )}
            </div>

            <div className="space-y-1">
              <p className="eyebrow">Blind recognition</p>
              <p data-numeric className="font-display text-2xl font-semibold">
                {summary.recognitionRate === null ? '--' : `${summary.recognitionRate}%`}
              </p>
              <p className="font-mono text-xs text-muted-foreground" data-numeric>
                {summary.diagnosticsSeen === 0
                  ? 'no statements seen'
                  : `${summary.diagnosticsSeen} statements`}
              </p>
            </div>

            {summary.focus ? (
              <div className="space-y-2">
                <p className="eyebrow">Closest to ready</p>
                <p className="truncate text-sm font-medium" title={summary.focus.name}>
                  {summary.focus.name}
                </p>
                <ReadinessPips met={summary.focus.met} total={summary.focus.total} />
                <Link
                  href={`/practice/solve/${summary.focus.slug}`}
                  className={cn(
                    'block truncate font-mono text-xs text-primary underline underline-offset-2',
                  )}
                  title={summary.focus.nextTitle}
                >
                  next: {summary.focus.nextTitle}
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="eyebrow">Next up</p>
                <p className="text-sm text-muted-foreground">
                  Every started rung is clear. Open the ladder and pick a new pattern.
                </p>
              </div>
            )}
          </div>
        </AnimatedCardContent>
      )}
    </AnimatedCard>
  );
}
