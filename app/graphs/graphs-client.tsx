'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Cloud,
  CloudOff,
  Loader2,
  Lock,
  Target,
} from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { Badge } from '@/components/ui/badge';
import { CodeViewer } from '@/components/code-viewer';
import { DagMap, type DagNode } from '@/components/graph/dag-map';
import {
  GRAPH_PATTERNS,
  PREREQUISITES,
  SIGNALS,
  allGraphSlugs,
  graphPatternById,
  patternStates,
  sanitizeGraphDone,
  type GraphPattern,
  type GraphProblem,
  type PatternState,
} from '@/lib/graph-track';
import { ladderProblem } from '@/lib/pattern-ladder';
import { cn, getDifficultyColor } from '@/lib/utils';

const LS_KEY = 'recalldsa-graphs-v1';
const SAVE_DEBOUNCE_MS = 600;

type SyncStatus = 'loading' | 'synced' | 'saving' | 'offline';

const SYNC_LABEL: Record<SyncStatus, { text: string; icon: typeof Cloud; tone: string }> = {
  loading: { text: 'Loading', icon: Loader2, tone: 'text-muted-foreground' },
  saving: { text: 'Saving', icon: Loader2, tone: 'text-muted-foreground' },
  synced: { text: 'Synced', icon: Cloud, tone: 'text-primary' },
  offline: { text: 'Saved on this device only', icon: CloudOff, tone: 'text-warning' },
};

const STATE_LABEL: Record<PatternState, string> = {
  locked: 'after its prerequisites',
  next: 'up next',
  active: 'in progress',
  done: 'complete',
};

/** Server is the source of truth, localStorage paints first. Same shape as the roadmap hook. */
function useGraphProgress() {
  const [done, setDone] = useState<Record<string, true>>({});
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState<SyncStatus>('loading');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSave = useRef(true);

  useEffect(() => {
    let cancelled = false;
    let local: Record<string, true> | null = null;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) local = sanitizeGraphDone(JSON.parse(raw));
    } catch {
      /* cache is optional */
    }
    if (local) setDone(local);

    (async () => {
      try {
        const res = await fetch('/api/graphs/state', { cache: 'no-store' });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { done: unknown | null };
        if (cancelled) return;
        if (data.done) {
          skipNextSave.current = true;
          setDone(sanitizeGraphDone(data.done));
        } else if (local) {
          await fetch('/api/graphs/state', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ done: local }),
          });
        }
        setStatus('synced');
      } catch {
        if (!cancelled) setStatus('offline');
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(done));
    } catch {
      /* quota or private mode */
    }
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    setStatus('saving');
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/graphs/state', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ done }),
        });
        setStatus(res.ok ? 'synced' : 'offline');
      } catch {
        setStatus('offline');
      }
    }, SAVE_DEBOUNCE_MS);
  }, [done, hydrated]);

  const toggle = useCallback((slug: string) => {
    setDone((prev) => {
      const next = { ...prev };
      if (next[slug]) delete next[slug];
      else next[slug] = true;
      return next;
    });
  }, []);

  return { done, toggle, status };
}

function ProblemRow({
  problem,
  done,
  onToggle,
}: {
  problem: GraphProblem;
  done: boolean;
  onToggle: () => void;
}) {
  const inLadder = ladderProblem(problem.slug) !== undefined;
  return (
    <li
      className={cn(
        'flex items-start gap-3 rounded-md border border-border bg-background/60 px-3 py-2.5 transition-colors',
        done && 'border-primary/30 bg-primary/5',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={done}
        aria-label={`${done ? 'Untick' : 'Tick'} ${problem.title}`}
        className={cn(
          'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border transition-colors',
          done
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border hover:border-primary/60',
        )}
      >
        {done && <Check className="h-3 w-3" strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <a
            href={`https://leetcode.com/problems/${problem.slug}/`}
            target="_blank"
            rel="noreferrer"
            className={cn(
              'group inline-flex items-center gap-1 text-sm font-medium hover:text-primary',
              done && 'text-muted-foreground line-through decoration-1',
            )}
          >
            <span className="font-mono text-xs text-muted-foreground">{problem.number}.</span>
            {problem.title}
            <ArrowUpRight className="h-3 w-3 opacity-50 group-hover:opacity-100" />
          </a>
          <Badge className={getDifficultyColor(problem.difficulty)}>{problem.difficulty}</Badge>
          {problem.premium && <Badge variant="warning">premium</Badge>}
          {inLadder && (
            <Link
              href={`/practice/solve/${problem.slug}`}
              className="font-mono text-[0.6875rem] text-info hover:underline"
            >
              log in practice
            </Link>
          )}
        </div>
        <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">{problem.note}</p>
      </div>
    </li>
  );
}

function PatternCard({
  pattern,
  index,
  state,
  done,
  open,
  onOpenChange,
  onToggle,
}: {
  pattern: GraphPattern;
  index: number;
  state: PatternState;
  done: Record<string, true>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggle: (slug: string) => void;
}) {
  const solved = pattern.problems.filter((p) => done[p.slug]).length;
  const total = pattern.problems.length;
  const deps = pattern.deps.map((d) => graphPatternById(d)?.name).filter(Boolean);

  return (
    <article
      id={`pattern-${pattern.id}`}
      className={cn(
        'scroll-mt-20 rounded-[var(--radius)] border border-border bg-surface elevated transition-colors',
        open && 'border-primary/40',
      )}
    >
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
      >
        <span
          className={cn(
            'grid h-9 w-9 shrink-0 place-items-center rounded-md border font-mono text-sm',
            state === 'done'
              ? 'border-primary bg-primary text-primary-foreground'
              : state === 'next'
                ? 'border-warning/60 text-warning'
                : 'border-border text-muted-foreground',
          )}
        >
          {state === 'done' ? <Check className="h-4 w-4" strokeWidth={3} /> : String(index + 1).padStart(2, '0')}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-display text-base font-semibold">{pattern.name}</span>
            {pattern.stretch && <Badge variant="outline">stretch</Badge>}
            {state === 'locked' && <Lock className="h-3 w-3 text-muted-foreground" aria-hidden />}
          </span>
          <span className="mt-0.5 block text-sm text-muted-foreground">{pattern.tagline}</span>
        </span>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block font-mono text-sm tabular">
            {solved}/{total}
          </span>
          <span className="block text-[0.6875rem] text-muted-foreground">{STATE_LABEL[state]}</span>
        </span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="space-y-5 border-t border-border px-5 pb-5 pt-4">
          {deps.length > 0 && (
            <p className="text-[0.8125rem] text-muted-foreground">
              Comes after: {deps.join(', ')}
            </p>
          )}
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="eyebrow mb-1.5">Spot it when</p>
                <ul className="space-y-1 text-sm">
                  {pattern.spotIt.map((s) => (
                    <li key={s} className="flex gap-2">
                      <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="eyebrow mb-1.5">The idea</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{pattern.idea}</p>
              </div>
              <div>
                <p className="eyebrow mb-1.5">Cost</p>
                <p className="font-mono text-[0.8125rem]">{pattern.complexity}</p>
              </div>
              <div>
                <p className="eyebrow mb-1.5">Where people slip</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {pattern.pitfalls.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="min-w-0">
              <p className="eyebrow mb-1.5">Template</p>
              <CodeViewer code={pattern.template} language="python" />
            </div>
          </div>
          <div>
            <p className="eyebrow mb-2">Problems, in order</p>
            <ol className="space-y-2">
              {pattern.problems.map((p) => (
                <ProblemRow
                  key={p.slug}
                  problem={p}
                  done={!!done[p.slug]}
                  onToggle={() => onToggle(p.slug)}
                />
              ))}
            </ol>
          </div>
        </div>
      )}
    </article>
  );
}

export default function GraphsPage() {
  const { done, toggle, status } = useGraphProgress();
  const [open, setOpen] = useState<Set<string>>(() => new Set(['dfs']));
  const [selected, setSelected] = useState<string | null>(null);

  const states = useMemo(() => patternStates(done), [done]);
  const totalSlugs = useMemo(() => allGraphSlugs().size, []);
  const tickedCount = Object.keys(done).length;
  const patternsDone = [...states.values()].filter((s) => s === 'done').length;

  const nodes = useMemo<DagNode[]>(
    () =>
      GRAPH_PATTERNS.map((p) => {
        const solved = p.problems.filter((q) => done[q.slug]).length;
        return {
          id: p.id,
          deps: p.deps,
          title: p.name,
          meta: `${solved} of ${p.problems.length} solved`,
          state: states.get(p.id) ?? 'locked',
          progress: solved / p.problems.length,
          opensNext: solved * 2 >= p.problems.length,
        };
      }),
    [done, states],
  );

  const jumpTo = useCallback((id: string) => {
    setSelected(id);
    setOpen((prev) => new Set(prev).add(id));
    requestAnimationFrame(() =>
      document.getElementById(`pattern-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  }, []);

  const sync = SYNC_LABEL[status];
  const SyncIcon = sync.icon;

  return (
    <div className="relative flex min-h-screen flex-col">
      <AnimatedBackground />
      <Header />

      <main className="container relative mx-auto max-w-5xl flex-1 space-y-12 px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-6 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="space-y-2">
            <p className="eyebrow">Practice track</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Graphs</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Learn the foundations first, then climb the patterns in the order the map shows.
              Every pattern has the signal that gives it away, a template to write from memory,
              and four or five LeetCode problems that each add one new twist. Tick a problem
              once you solve it without help.
            </p>
          </div>
          <div className="flex shrink-0 gap-6">
            <div>
              <p className="eyebrow">Solved</p>
              <p className="font-mono text-2xl tabular">
                {tickedCount}
                <span className="text-sm text-muted-foreground">/{totalSlugs}</span>
              </p>
            </div>
            <div>
              <p className="eyebrow">Patterns</p>
              <p className="font-mono text-2xl tabular">
                {patternsDone}
                <span className="text-sm text-muted-foreground">/{GRAPH_PATTERNS.length}</span>
              </p>
            </div>
            <p className={cn('flex items-center gap-1.5 self-end pb-1 text-xs', sync.tone)}>
              <SyncIcon
                className={cn('h-3.5 w-3.5', (status === 'loading' || status === 'saving') && 'animate-spin')}
              />
              {sync.text}
            </p>
          </div>
        </motion.div>

        <section className="space-y-4">
          <div>
            <h2 className="font-display text-xl font-semibold">Learn these first</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Graph problems are mostly these pieces put together. If any line below feels
              shaky, fix it before the patterns, or every problem turns into two problems.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {PREREQUISITES.map((pre, i) => (
              <div key={pre.id} className="surface-panel space-y-3 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <span className="font-mono text-xs text-muted-foreground">P{i + 1}</span>
                  {pre.name}
                </p>
                <ul className="list-disc space-y-1 pl-5 text-[0.8125rem] text-muted-foreground">
                  {pre.mustKnow.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
                {pre.warmups.length > 0 && (
                  <ul className="space-y-2">
                    {pre.warmups.map((w) => (
                      <ProblemRow
                        key={w.slug}
                        problem={w}
                        done={!!done[w.slug]}
                        onToggle={() => toggle(w.slug)}
                      />
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="font-display text-xl font-semibold">Pattern map</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A pattern opens once each one above it is half done. Click any pattern to jump
              to it. Locked ones still open, the lock is only a suggestion.
            </p>
          </div>
          <DagMap
            nodes={nodes}
            selected={selected}
            onSelect={jumpTo}
            legend={
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.8125rem] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm shadow-[0_0_0_1.5px_hsl(var(--warning))]" />
                  up next
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
                  complete
                </span>
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3 w-3" />
                  after its prerequisites
                </span>
              </div>
            }
          />
        </section>

        <section className="space-y-3">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-xl font-semibold">The patterns</h2>
            <button
              type="button"
              onClick={() =>
                setOpen((prev) =>
                  prev.size === GRAPH_PATTERNS.length
                    ? new Set()
                    : new Set(GRAPH_PATTERNS.map((p) => p.id)),
                )
              }
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {open.size === GRAPH_PATTERNS.length ? 'Collapse all' : 'Expand all'}
            </button>
          </div>
          {GRAPH_PATTERNS.map((p, i) => (
            <PatternCard
              key={p.id}
              pattern={p}
              index={i}
              state={states.get(p.id) ?? 'locked'}
              done={done}
              open={open.has(p.id)}
              onOpenChange={(isOpen) =>
                setOpen((prev) => {
                  const next = new Set(prev);
                  if (isOpen) next.add(p.id);
                  else next.delete(p.id);
                  return next;
                })
              }
              onToggle={toggle}
            />
          ))}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="font-display text-xl font-semibold">Which pattern is it?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Read the problem, find the closest line here, then check the constraints agree.
            </p>
          </div>
          <div className="overflow-x-auto rounded-[var(--radius)] border border-border bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="eyebrow px-4 py-2.5 font-medium">If the problem says</th>
                  <th className="eyebrow px-4 py-2.5 font-medium">Reach for</th>
                  <th className="eyebrow hidden px-4 py-2.5 font-medium md:table-cell">Because</th>
                </tr>
              </thead>
              <tbody>
                {SIGNALS.map((s) => (
                  <tr key={s.signal} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5">{s.signal}</td>
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => jumpTo(s.pattern)}
                        className="whitespace-nowrap text-left font-medium text-primary hover:underline"
                      >
                        {graphPatternById(s.pattern)?.name}
                      </button>
                    </td>
                    <td className="hidden px-4 py-2.5 text-muted-foreground md:table-cell">{s.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
