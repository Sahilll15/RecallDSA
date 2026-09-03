'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, GitBranch, ListChecks, Rows3, Timer } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DebtList, type DebtItem } from '@/components/practice/debt-list';
import { LadderMap } from '@/components/practice/ladder-map';
import { PracticePanel, type PracticePanelData } from '@/components/practice/practice-panel';
import { RungCard, type RungProgress } from '@/components/practice/rung-card';
import { RungDrawer, type LastTick, type PrereqCard } from '@/components/practice/rung-drawer';
import { groupedLadder, ladderProblem, rungById, type LadderProblem } from '@/lib/pattern-ladder';
import { rungStandings } from '@/lib/ladder-graph';
import type { RungReadiness, SolveOutcome } from '@/lib/practice';
import { cn } from '@/lib/utils';

interface PracticeClientProps {
  user: { name?: string | null; email?: string | null };
  readiness: RungReadiness[];
  progress: Record<string, RungProgress>;
  debts: DebtItem[];
  panel: PracticePanelData;
  totals: {
    attempted: number;
    solvedUnaided: number;
    readyRungs: number;
    openDebts: number;
    diagnosticsSeen: number;
    diagnosticsCorrect: number;
  };
}

type View = 'tree' | 'list';

const EMPTY_PROGRESS: RungProgress = { cleared: [], owed: [] };
const VIEW_KEY = 'recalldsa:practice-view';

export function PracticeClient({
  user,
  readiness,
  progress: serverProgress,
  debts,
  panel,
}: PracticeClientProps) {
  const router = useRouter();
  const byRungId = useMemo(() => new Map(readiness.map((r) => [r.rungId, r])), [readiness]);
  const groups = useMemo(() => groupedLadder(), []);

  const [view, setView] = useState<View>('tree');
  const [selected, setSelected] = useState<string | null>(null);
  const [lastTick, setLastTick] = useState<LastTick | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());

  // Ticks apply locally first so the map fills in on the tap; the server copy
  // arrives on the next refresh and replaces this wholesale.
  const [progress, setProgress] = useState(serverProgress);
  useEffect(() => {
    setProgress(serverProgress);
  }, [serverProgress]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(VIEW_KEY);
      if (stored === 'list' || stored === 'tree') setView(stored);
    } catch {
      // Preference only.
    }
  }, []);

  const pickView = (next: View) => {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_KEY, next);
    } catch {
      // Preference only.
    }
  };

  const clearedSlugs = useMemo(
    () => new Set(Object.values(progress).flatMap((p) => p.cleared)),
    [progress],
  );
  const owedSlugs = useMemo(
    () => new Set(Object.values(progress).flatMap((p) => p.owed)),
    [progress],
  );
  const standings = useMemo(() => rungStandings(clearedSlugs), [clearedSlugs]);

  const mutate = useCallback(
    (rungId: string, fn: (entry: RungProgress) => RungProgress) => {
      setProgress((prev) => ({ ...prev, [rungId]: fn(prev[rungId] ?? EMPTY_PROGRESS) }));
    },
    [],
  );

  const tick = useCallback(
    async (problem: LadderProblem, outcome: SolveOutcome) => {
      const found = ladderProblem(problem.slug);
      if (!found) return;
      const rungId = found.rung.id;

      setPending((s) => new Set(s).add(problem.slug));
      mutate(rungId, (entry) =>
        outcome === 'unaided'
          ? {
              cleared: [...new Set([...entry.cleared, problem.slug])],
              owed: entry.owed.filter((s) => s !== problem.slug),
            }
          : {
              cleared: entry.cleared,
              owed: [...new Set([...entry.owed, problem.slug])],
            },
      );

      try {
        const res = await fetch('/api/practice/attempt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: problem.slug, outcome }),
        });
        if (!res.ok) throw new Error('save failed');
        const data = await res.json();
        setLastTick({ slug: problem.slug, attemptId: data.attempt.id, outcome });
        router.refresh();
      } catch {
        setProgress(serverProgress);
      } finally {
        setPending((s) => {
          const next = new Set(s);
          next.delete(problem.slug);
          return next;
        });
      }
    },
    [mutate, router, serverProgress],
  );

  const undo = useCallback(async () => {
    if (!lastTick) return;
    const found = ladderProblem(lastTick.slug);
    const { attemptId, slug, outcome } = lastTick;
    setLastTick(null);
    if (found) {
      mutate(found.rung.id, (entry) =>
        outcome === 'unaided'
          ? { cleared: entry.cleared.filter((s) => s !== slug), owed: entry.owed }
          : { cleared: entry.cleared, owed: entry.owed.filter((s) => s !== slug) },
      );
    }
    try {
      await fetch(`/api/practice/attempt/${attemptId}`, { method: 'DELETE' });
    } finally {
      router.refresh();
    }
  }, [lastTick, mutate, router]);

  const selectedRung = selected ? rungById(selected) ?? null : null;
  const selectedStanding = selected ? standings.get(selected) ?? null : null;
  const selectedChecks = selected ? byRungId.get(selected)?.checks ?? [] : [];
  const selectedPrereqs = useMemo<PrereqCard[]>(
    () =>
      (selectedRung?.deps ?? []).map((id) => ({
        id,
        name: rungById(id)?.name ?? id,
        cleared: standings.get(id)?.anchorsCleared ?? false,
      })),
    [selectedRung, standings],
  );

  const completeRungs = [...standings.values()].filter((s) => s.state === 'complete').length;
  const panelData: PracticePanelData = { ...panel, rungsComplete: completeRungs };

  // The one thing to do next: an in-progress rung nearest ready, else an open root.
  const started = readiness.filter((r) => r.status === 'in-progress' && r.nextProblem);
  const suggestion =
    started.sort((a, b) => b.met - a.met)[0] ??
    readiness.find((r) => standings.get(r.rungId)?.state === 'next' && r.nextProblem) ??
    null;

  return (
    <div className="relative flex min-h-screen flex-col">
      <AnimatedBackground />
      <Header user={user} />

      <main className="container relative mx-auto max-w-6xl flex-1 space-y-6 px-4 py-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="eyebrow flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5 text-primary" />
              Practice
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              Problems you have not solved yet
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              188 problems in 37 rungs, in a recommended order. Open a rung and tick a problem
              once you have solved it without help. Only an unaided solve counts, and anything
              you read the answer to comes back as a re-derive.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="View"
            className="flex rounded-md border border-border bg-surface p-0.5"
          >
            {(
              [
                { id: 'tree', label: 'Tree', icon: GitBranch },
                { id: 'list', label: 'List', icon: Rows3 },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                role="tab"
                type="button"
                aria-selected={view === opt.id}
                onClick={() => pickView(opt.id)}
                className={cn(
                  'flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-colors',
                  view === opt.id
                    ? 'bg-accent font-medium text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <opt.icon className="h-3.5 w-3.5" />
                {opt.label}
              </button>
            ))}
          </div>
        </header>

        {view === 'tree' ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <LadderMap standings={standings} selected={selected} onSelect={setSelected} />
            <PracticePanel data={panelData} />
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {suggestion?.nextProblem ? (
            <Card className="border-primary/30">
              <CardContent className="flex h-full flex-col justify-between gap-4 p-5">
                <div className="min-w-0 space-y-1">
                  <p className="eyebrow">Start here</p>
                  <p className="truncate font-medium">{suggestion.nextProblem.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {rungById(suggestion.rungId)?.name} &middot; {suggestion.met} of{' '}
                    {suggestion.total} checks met
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/practice/solve/${suggestion.nextProblem.slug}`}>
                    <Button>
                      <Timer className="h-4 w-4" />
                      Solve with timer
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={() => setSelected(suggestion.rungId)}>
                    Open rung
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex h-full items-center p-5 text-sm text-muted-foreground">
                Every open rung is complete. Pick a waiting one from the tree and carry on.
              </CardContent>
            </Card>
          )}

          <DebtList debts={debts} />
        </div>

        {view === 'list' &&
          groups.map((group) => (
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

      <RungDrawer
        rung={selectedRung}
        standing={selectedStanding}
        prereqs={selectedPrereqs}
        checks={selectedChecks}
        cleared={clearedSlugs}
        owed={owedSlugs}
        pending={pending}
        lastTick={lastTick}
        onTick={tick}
        onUndo={undo}
        onClose={() => setSelected(null)}
      />

      <Footer />
    </div>
  );
}
