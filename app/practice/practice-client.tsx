'use client';

import Link from 'next/link';
import { ArrowRight, Crosshair, Gauge, ListChecks, Timer, TrendingUp } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MetricStrip } from '@/components/ui/metric-strip';
import { DebtList, type DebtItem } from '@/components/practice/debt-list';
import { RungCard, type RungProgress } from '@/components/practice/rung-card';
import { groupedLadder } from '@/lib/pattern-ladder';
import type { RungReadiness } from '@/lib/practice';
import { DECK_SIZE } from '@/lib/diagnostic';

interface PracticeClientProps {
  user: { name?: string | null; email?: string | null };
  readiness: RungReadiness[];
  progress: Record<string, RungProgress>;
  debts: DebtItem[];
  totals: {
    attempted: number;
    solvedUnaided: number;
    readyRungs: number;
    openDebts: number;
    diagnosticsSeen: number;
    diagnosticsCorrect: number;
  };
}

const EMPTY_PROGRESS: RungProgress = { cleared: [], owed: [] };

export function PracticeClient({
  user,
  readiness,
  progress,
  debts,
  totals,
}: PracticeClientProps) {
  const byRungId = new Map(readiness.map((r) => [r.rungId, r]));
  const groups = groupedLadder();
  const totalRungs = readiness.length;

  const recognitionRate =
    totals.diagnosticsSeen > 0
      ? Math.round((totals.diagnosticsCorrect / totals.diagnosticsSeen) * 100)
      : null;

  // The one thing to do next, so the page opens on an action rather than a map.
  const started = readiness.filter((r) => r.status === 'in-progress' && r.nextProblem);
  const suggestion =
    started.sort((a, b) => b.met - a.met)[0] ??
    readiness.find((r) => r.status === 'untouched' && r.nextProblem) ??
    null;

  return (
    <div className="relative flex min-h-screen flex-col">
      <AnimatedBackground />
      <Header user={user} />

      <main className="container relative mx-auto max-w-4xl flex-1 space-y-6 px-4 py-10">
        <header className="space-y-2">
          <p className="eyebrow flex items-center gap-1.5">
            <ListChecks className="h-3.5 w-3.5 text-primary" />
            Practice ladder
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Problems you have not solved yet
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            The rest of this app measures how well you rebuild problems you already solved. This
            is the other half: a first attempt, timed, with the outcome recorded honestly. Only an
            unaided solve counts, and anything you read the answer to comes back as a re-derive.
          </p>
        </header>

        <MetricStrip
          metrics={[
            {
              label: 'Rungs ready',
              value: `${totals.readyRungs}/${totalRungs}`,
              sub: 'every check met',
              icon: Gauge,
              tone: totals.readyRungs > 0 ? 'text-primary' : undefined,
            },
            {
              label: 'Solved unaided',
              value: totals.solvedUnaided,
              sub: `of ${totals.attempted} attempted`,
              icon: TrendingUp,
            },
            {
              label: 'Blind recognition',
              value: recognitionRate === null ? '--' : `${recognitionRate}%`,
              sub:
                totals.diagnosticsSeen === 0
                  ? 'no statements seen'
                  : `${totals.diagnosticsSeen} statements`,
              icon: Crosshair,
            },
            {
              label: 'Re-derives owed',
              value: totals.openDebts,
              sub: totals.openDebts === 0 ? 'nothing owed' : 'read, not derived',
              icon: Timer,
              tone: totals.openDebts > 0 ? 'text-warning' : undefined,
            },
          ]}
        />

        <DebtList debts={debts} />

        <Card interactive>
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="eyebrow flex items-center gap-1.5">
                <Crosshair className="h-3.5 w-3.5 text-primary" />
                Blind diagnostic
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {DECK_SIZE} real statements with the topic hidden, one minute each. Name the
                pattern, no coding. It is the only reading here taken on problems you have never
                seen, which is what an interview actually tests.
              </p>
            </div>
            <Link href="/practice/diagnostic" className="shrink-0">
              <Button>
                Run it
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {suggestion?.nextProblem && (
          <Card className="border-primary/30">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="eyebrow">Start here</p>
                <p className="truncate font-medium">{suggestion.nextProblem.title}</p>
                <p className="text-xs text-muted-foreground">
                  {suggestion.met} of {suggestion.total} checks met on this rung
                </p>
              </div>
              <Link href={`/practice/solve/${suggestion.nextProblem.slug}`} className="shrink-0">
                <Button>
                  Open
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {groups.map((group) => (
          <section key={group.group} className="space-y-3">
            <h2 className="eyebrow">{group.group}</h2>
            <div className="space-y-2">
              {group.rungs.map((rung) => {
                const rungReadiness = byRungId.get(rung.id);
                if (!rungReadiness) return null;
                return (
                  <RungCard
                    key={rung.id}
                    rung={rung}
                    readiness={rungReadiness}
                    progress={progress[rung.id] ?? EMPTY_PROGRESS}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </main>

      <Footer />
    </div>
  );
}
