import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RecallMeter } from '@/components/ui/recall-meter';
import { cn, formatProblemTitle, formatRelativeDate, getDifficultyColor } from '@/lib/utils';
import { patternLabel } from '@/lib/constants';

export interface RevisionRowData {
  id: string;
  nextDate: string;
  lastRevised: string | null;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  problem: {
    id: string;
    title: string;
    difficulty: string | null;
    platform: string | null;
    pattern: string | null;
  };
}

/** One problem in the queue: identity, schedule, and how well it is holding. */
export function RevisionRow({ revision, now }: { revision: RevisionRowData; now: Date }) {
  const isOverdue = new Date(revision.nextDate) < now;

  return (
    <Card interactive className={cn('relative overflow-hidden', isOverdue && 'border-destructive/25')}>
      {/* Overdue is a rule on the edge, not a wash over the row. */}
      {isOverdue && <span className="absolute inset-y-0 left-0 w-[3px] bg-destructive" />}

      <div className="flex flex-col gap-4 p-4 pl-5 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-semibold leading-tight">
              {formatProblemTitle(revision.problem.title)}
            </h3>
            {isOverdue && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3" />
                Overdue
              </Badge>
            )}
            {revision.lapses > 0 && (
              <Badge variant="warning">
                <span data-numeric>{revision.lapses}</span> lapse
                {revision.lapses === 1 ? '' : 's'}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            {revision.problem.pattern && (
              <Badge variant="code">{patternLabel(revision.problem.pattern)}</Badge>
            )}
            {revision.problem.difficulty && (
              <Badge className={getDifficultyColor(revision.problem.difficulty)}>
                {revision.problem.difficulty}
              </Badge>
            )}
            {revision.problem.platform && (
              <Badge variant="outline">{revision.problem.platform}</Badge>
            )}
          </div>

          <dl className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-xs">
            <div className="flex items-center gap-1.5">
              <dt className="text-muted-foreground">next</dt>
              <dd
                data-numeric
                className={cn('font-medium', isOverdue ? 'text-destructive' : 'text-foreground')}
              >
                {formatRelativeDate(revision.nextDate)}
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="text-muted-foreground">interval</dt>
              <dd data-numeric className="font-medium text-foreground">
                {revision.intervalDays}d
              </dd>
            </div>
            {revision.lastRevised && (
              <div className="flex items-center gap-1.5">
                <dt className="text-muted-foreground">last</dt>
                <dd data-numeric className="font-medium text-foreground">
                  {formatRelativeDate(revision.lastRevised)}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-2.5">
          <RecallMeter
            intervalDays={revision.intervalDays}
            repetitions={revision.repetitions}
            lapses={revision.lapses}
          />
          <Link href={`/problems/${revision.problem.id}`}>
            <Button variant="outline" size="sm" className="group/btn">
              Open
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
