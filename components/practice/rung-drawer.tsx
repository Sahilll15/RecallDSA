'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, ChevronDown, Lock, Timer, Undo2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { patternLabel } from '@/lib/constants';
import { triggerFor } from '@/lib/pattern-triggers';
import {
  TIER_LABELS,
  TIME_BUDGET_MIN,
  rungById,
  type LadderProblem,
  type LadderRung,
} from '@/lib/pattern-ladder';
import type { RungStanding } from '@/lib/ladder-graph';
import { DEBT_DAYS, OUTCOME_LABELS, type SolveOutcome } from '@/lib/practice';
import { cn } from '@/lib/utils';
import { ReadinessChecklist } from './readiness-checklist';
import type { ReadinessCheck } from '@/lib/practice';

const TIER_TONE: Record<string, string> = {
  anchor: 'text-info',
  rep: 'text-muted-foreground',
  twist: 'text-warning',
  boss: 'text-destructive',
};

/** Outcomes offered behind the tick. Unaided is the tick itself. */
const OTHER_OUTCOMES: SolveOutcome[] = ['hinted', 'editorial', 'failed'];

export interface LastTick {
  slug: string;
  attemptId: string;
  outcome: SolveOutcome;
}

interface RungDrawerProps {
  rung: LadderRung | null;
  standing: RungStanding | null;
  checks: ReadinessCheck[];
  cleared: Set<string>;
  owed: Set<string>;
  pending: Set<string>;
  lastTick: LastTick | null;
  onTick: (problem: LadderProblem, outcome: SolveOutcome) => void;
  onUndo: () => void;
  onClose: () => void;
}

/**
 * One rung, with a tick per problem. The tick logs an unaided solve, which is
 * the only outcome the readiness rule trusts; the other three sit one tap
 * behind it so being honest costs one extra click rather than a form.
 */
export function RungDrawer({
  rung,
  standing,
  checks,
  cleared,
  owed,
  pending,
  lastTick,
  onTick,
  onUndo,
  onClose,
}: RungDrawerProps) {
  const open = rung !== null;
  const [menuFor, setMenuFor] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMenuFor(null);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, rung?.id]);

  const trigger = rung ? triggerFor(rung.corePattern) : undefined;
  const next = rung?.problems.find((p) => !cleared.has(p.slug)) ?? null;

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-[55] bg-background/60 backdrop-blur-[2px] transition-opacity duration-200',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <aside
        aria-hidden={!open}
        aria-label={rung ? rung.name : 'Rung details'}
        className={cn(
          'fixed inset-y-0 right-0 z-[60] flex w-[420px] max-w-[92vw] flex-col border-l border-border bg-surface elevated-raised transition-transform duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)]',
          open ? 'translate-x-0' : 'translate-x-[102%]',
        )}
      >
        {rung && standing && (
          <>
            <div className="relative border-b border-border px-6 pb-5 pt-5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-3 top-3 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="code">{rung.group}</Badge>
                {standing.state === 'complete' && <Badge variant="success">Complete</Badge>}
                {standing.state === 'next' && <Badge variant="warning">Up next</Badge>}
                {standing.state === 'locked' && (
                  <Badge variant="outline">
                    <Lock className="h-3 w-3" />
                    Waiting
                  </Badge>
                )}
              </div>

              <h2 className="pr-8 font-display text-2xl font-semibold leading-tight tracking-tight">
                {rung.name}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                <span data-numeric>
                  {standing.solvedUnaided}/{standing.total}
                </span>{' '}
                solved unaided
                {patternLabel(rung.corePattern) !== rung.name && (
                  <> &middot; trains {patternLabel(rung.corePattern)}</>
                )}
              </p>

              {standing.blockedBy.length > 0 && (
                <p className="mt-3 rounded-md border border-border bg-surface-raised px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                  Comes after{' '}
                  {standing.blockedBy
                    .map((id) => rungById(id)?.name ?? id)
                    .join(' and ')}
                  . Clear their anchors first, or carry on here anyway: the order is advice.
                </p>
              )}
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              {trigger && (
                <section className="space-y-1.5">
                  <p className="eyebrow">The trigger</p>
                  <p className="text-sm leading-relaxed">{trigger.features}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {trigger.mechanism}
                  </p>
                </section>
              )}

              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="eyebrow">Problems</p>
                  <p className="text-[0.6875rem] text-muted-foreground">
                    tick = solved without help
                  </p>
                </div>

                <ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
                  {rung.problems.map((problem) => {
                    const done = cleared.has(problem.slug);
                    const busy = pending.has(problem.slug);
                    const isNext = next?.slug === problem.slug;
                    const justTicked = lastTick?.slug === problem.slug;
                    return (
                      <li
                        key={problem.slug}
                        className={cn('space-y-2 px-3 py-2', isNext && 'bg-primary-soft/60')}
                      >
                        <div className="flex items-center gap-3 pl-1">
                          <button
                            type="button"
                            disabled={busy || done}
                            onClick={() => onTick(problem, 'unaided')}
                            aria-label={
                              done ? `${problem.title} solved unaided` : `Mark ${problem.title} solved unaided`
                            }
                            className={cn(
                              'group grid h-11 w-11 -m-2.5 shrink-0 place-items-center rounded-md transition-colors',
                              !done && 'hover:bg-accent/60',
                              busy && 'opacity-50',
                            )}
                          >
                            <span
                              className={cn(
                                'grid h-6 w-6 place-items-center rounded border transition-colors',
                                done
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-border-strong text-transparent group-hover:border-primary group-hover:text-primary/60',
                              )}
                            >
                              <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            </span>
                          </button>

                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                'truncate text-sm',
                                done && 'text-muted-foreground line-through',
                              )}
                            >
                              <span data-numeric className="text-muted-foreground">
                                {problem.number}.
                              </span>{' '}
                              {problem.title}
                            </p>
                            <p className="flex items-center gap-2 text-[0.6875rem]">
                              <span
                                className={cn(
                                  'font-mono uppercase tracking-wide',
                                  TIER_TONE[problem.tier],
                                )}
                              >
                                {TIER_LABELS[problem.tier]}
                              </span>
                              <span className="font-mono text-muted-foreground">
                                {TIME_BUDGET_MIN[problem.difficulty]}m
                              </span>
                              {owed.has(problem.slug) && !done && (
                                <Badge variant="warning" className="px-1.5 py-0 text-[0.625rem]">
                                  owed
                                </Badge>
                              )}
                            </p>
                          </div>

                          {justTicked ? (
                            <button
                              type="button"
                              onClick={onUndo}
                              className="flex h-10 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                              title="Undo that tick"
                            >
                              <Undo2 className="h-3 w-3" />
                              undo
                            </button>
                          ) : (
                            !done && (
                              <button
                                type="button"
                                onClick={() => setMenuFor(menuFor === problem.slug ? null : problem.slug)}
                                aria-expanded={menuFor === problem.slug}
                                aria-label="Log a different outcome"
                                className="grid h-10 w-10 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                              >
                                <ChevronDown
                                  className={cn(
                                    'h-3.5 w-3.5 transition-transform',
                                    menuFor === problem.slug && 'rotate-180',
                                  )}
                                />
                              </button>
                            )
                          )}

                          <Link
                            href={`/practice/solve/${problem.slug}`}
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
                            aria-label={`Open ${problem.title} with the timer`}
                            title="Solve with the phase timer"
                          >
                            <Timer className="h-3.5 w-3.5" />
                          </Link>
                        </div>

                        {menuFor === problem.slug && !done && (
                          <div className="flex flex-wrap gap-1.5 pl-9">
                            {OTHER_OUTCOMES.map((outcome) => (
                              <button
                                key={outcome}
                                type="button"
                                disabled={busy}
                                onClick={() => {
                                  setMenuFor(null);
                                  onTick(problem, outcome);
                                }}
                                className="rounded-md border border-border bg-surface px-2 py-1 text-[0.6875rem] transition-colors hover:border-border-strong hover:bg-surface-raised"
                              >
                                {OUTCOME_LABELS[outcome]}
                                <span className="ml-1 font-mono text-muted-foreground">
                                  +{DEBT_DAYS[outcome]}d
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
                  A tick here records no time, so the pace check stays open until you solve
                  through the timer. The arrow logs hinted, read or failed, each booking a
                  re-derive.
                </p>
              </section>

              <section className="space-y-2">
                <p className="eyebrow">Ready when</p>
                <ReadinessChecklist checks={checks} />
              </section>
            </div>

            {next && (
              <div className="border-t border-border px-6 py-4">
                <Link href={`/practice/solve/${next.slug}`} className="block">
                  <Button size="lg" className="w-full">
                    <Timer className="h-4 w-4" />
                    Solve next: {next.title}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </aside>
    </>
  );
}
