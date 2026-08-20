'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  History,
  Layers,
  Loader2,
  Search,
  Tags,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RevisionRow, type RevisionRowData } from '@/components/revision-row';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatProblemTitle, formatRelativeDate, getDifficultyColor } from '@/lib/utils';
import { patternLabel } from '@/lib/constants';
import { MASTERY_INTERVAL_DAYS } from '@/lib/spaced-repetition';

type Revision = RevisionRowData;

type Filter = 'due' | 'upcoming' | 'mastered' | 'all';

interface BackfillResult {
  scheduled: number;
  skipped: number;
  duplicatesCollapsed: number;
  days: number;
  problems: Array<{ id: string; title: string; pattern: string | null; solvedAt: string }>;
}

interface DuplicateReport {
  duplicates: number;
  total: number;
  titles: string[];
}

interface ClassifyReport {
  unclassified: number;
  total: number;
}

/** How long an automatic commit sync waits before running again. */
const AUTO_SYNC_INTERVAL_MS = 30 * 60 * 1000;
const AUTO_SYNC_KEY = 'recalldsa:last-auto-sync';

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'due', label: 'Due' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'mastered', label: 'Mastered' },
  { key: 'all', label: 'All' },
];

export default function RevisionPage() {
  const [allRevisions, setAllRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('due');

  const [backfilling, setBackfilling] = useState(false);
  const [backfill, setBackfill] = useState<BackfillResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [duplicates, setDuplicates] = useState<DuplicateReport | null>(null);
  const [cleaning, setCleaning] = useState(false);
  const [cleaned, setCleaned] = useState<number | null>(null);

  const [classify, setClassify] = useState<ClassifyReport | null>(null);
  const [classifying, setClassifying] = useState(false);
  const [classified, setClassified] = useState<number | null>(null);

  const [query, setQuery] = useState('');

  const loadRevisions = useCallback(
    () =>
      fetch('/api/revisions')
        .then((r) => r.json())
        .then((data) => setAllRevisions(Array.isArray(data) ? data : [])),
    [],
  );

  const loadDuplicates = useCallback(
    () =>
      fetch('/api/revisions/dedupe')
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => setDuplicates(data))
        .catch(() => setDuplicates(null)),
    [],
  );

  const loadClassify = useCallback(
    () =>
      fetch('/api/problems/enrich')
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => setClassify(data))
        .catch(() => setClassify(null)),
    [],
  );

  const refresh = useCallback(
    () => Promise.all([loadRevisions(), loadDuplicates(), loadClassify()]),
    [loadRevisions, loadDuplicates, loadClassify],
  );

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  // Coming back to the tab should show the real queue, not a stale snapshot.
  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState === 'visible') loadRevisions();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [loadRevisions]);

  // Newly solved problems appear without being asked for. Throttled, because a
  // backfill walks commit history and that is not free.
  useEffect(() => {
    let cancelled = false;

    const lastRun = Number(window.localStorage.getItem(AUTO_SYNC_KEY) ?? 0);
    if (Date.now() - lastRun < AUTO_SYNC_INTERVAL_MS) return;

    window.localStorage.setItem(AUTO_SYNC_KEY, String(Date.now()));

    fetch('/api/repos/backfill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: 7 }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (data.scheduled > 0) setBackfill(data);
        return refresh();
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const runClassify = async () => {
    setClassifying(true);
    setError(null);
    let offset = 0;
    let updated = 0;

    try {
      // Batched so a large library cannot outlive the request timeout.
      for (let guard = 0; guard < 60; guard++) {
        const res = await fetch('/api/problems/enrich', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ offset, limit: 25 }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Could not classify problems');

        updated += data.updated ?? 0;
        offset = data.nextOffset ?? offset + 25;
        if (data.done) break;
      }

      setClassified(updated);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not classify problems');
    } finally {
      setClassifying(false);
    }
  };

  const runBackfill = async () => {
    setBackfilling(true);
    setBackfill(null);
    setError(null);
    try {
      const res = await fetch('/api/repos/backfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 7 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Backfill failed');
      setBackfill(data);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Backfill failed');
    } finally {
      setBackfilling(false);
    }
  };

  const removeDuplicates = async () => {
    setCleaning(true);
    setError(null);
    try {
      const res = await fetch('/api/revisions/dedupe', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Could not remove duplicates');
      setCleaned(data.removed);
      setDuplicates(null);
      await loadRevisions();
      await loadDuplicates();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove duplicates');
    } finally {
      setCleaning(false);
    }
  };

  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const due = allRevisions.filter((r) => new Date(r.nextDate) < endOfToday);
  const upcoming = allRevisions.filter((r) => new Date(r.nextDate) >= endOfToday);
  const mastered = allRevisions.filter((r) => r.intervalDays >= MASTERY_INTERVAL_DAYS);

  const scoped =
    filter === 'due'
      ? due
      : filter === 'upcoming'
        ? upcoming
        : filter === 'mastered'
          ? mastered
          : allRevisions;

  const needle = query.trim().toLowerCase();
  const shown = needle
    ? scoped.filter((r) =>
        `${r.problem.title} ${r.problem.pattern ?? ''} ${r.problem.difficulty ?? ''}`
          .toLowerCase()
          .includes(needle),
      )
    : scoped;

  const stats = [
    {
      key: 'due' as Filter,
      label: 'Due now',
      value: due.length,
      sub: 'ready to recall',
      icon: Target,
      tone: 'text-destructive',
    },
    {
      key: 'upcoming' as Filter,
      label: 'Upcoming',
      value: upcoming.length,
      sub: 'scheduled ahead',
      icon: TrendingUp,
      tone: 'text-info',
    },
    {
      key: 'mastered' as Filter,
      label: 'Mastered',
      value: mastered.length,
      sub: `${MASTERY_INTERVAL_DAYS}d interval or longer`,
      icon: Trophy,
      tone: 'text-primary',
    },
  ];

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <Header />

      <main className="container relative mx-auto max-w-6xl px-4 py-10">
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="space-y-2">
            <p className="eyebrow">Spaced repetition</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Revision
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Reconstruct the pattern, the approach, and the solution before you peek.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="outline" onClick={runBackfill} disabled={backfilling}>
              {backfilling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <History className="h-4 w-4" />
              )}
              {backfilling ? 'Reading commits' : "Add this week's solves"}
            </Button>
            {due.length > 0 && (
              <Link href="/revision/recall">
                <Button size="lg" className="group">
                  <Brain className="h-4 w-4" />
                  Start recall
                  <span
                    data-numeric
                    className="rounded bg-primary-foreground/15 px-1.5 py-0.5 font-mono text-xs"
                  >
                    {due.length}
                  </span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            )}
          </div>
        </motion.header>

        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-2.5 rounded-[var(--radius)] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {duplicates && duplicates.duplicates > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex flex-col gap-3 rounded-[var(--radius)] border border-warning/30 bg-warning/[0.07] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-2.5">
              <Layers className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <div className="space-y-0.5 text-sm">
                <p className="font-medium">
                  <span data-numeric>{duplicates.duplicates}</span> duplicate{' '}
                  {duplicates.duplicates === 1 ? 'card' : 'cards'} left over from earlier syncs
                </p>
                <p className="text-muted-foreground">
                  The queue already hides them. Removing them keeps your counts honest and
                  preserves the copy holding the review history.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={removeDuplicates}
              disabled={cleaning}
              className="shrink-0 border-warning/40 text-warning hover:bg-warning/10"
            >
              {cleaning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {cleaning ? 'Removing' : 'Remove duplicates'}
            </Button>
          </motion.div>
        )}

        {classify && classify.unclassified > 0 && classified === null && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex flex-col gap-3 rounded-[var(--radius)] border border-info/30 bg-info/[0.07] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-2.5">
              <Tags className="mt-0.5 h-4 w-4 shrink-0 text-info" />
              <div className="space-y-0.5 text-sm">
                <p className="font-medium">
                  <span data-numeric>{classify.unclassified}</span> of{' '}
                  <span data-numeric>{classify.total}</span> problems have no pattern
                </p>
                <p className="text-muted-foreground">
                  A file path names the problem, not the technique. This reads the real topic
                  tags from LeetCode and fills in the pattern and difficulty.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={runClassify}
              disabled={classifying}
              className="shrink-0 border-info/40 text-info hover:bg-info/10"
            >
              {classifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {classifying ? 'Classifying' : 'Classify patterns'}
            </Button>
          </motion.div>
        )}

        {classified !== null && (
          <div className="mt-6 flex items-center gap-2.5 rounded-[var(--radius)] border border-primary/30 bg-primary/[0.07] px-4 py-3 text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
            <span>
              Classified <span data-numeric>{classified}</span> problem
              {classified === 1 ? '' : 's'} from their LeetCode topic tags.
            </span>
          </div>
        )}

        {cleaned !== null && (
          <div className="mt-6 flex items-center gap-2.5 rounded-[var(--radius)] border border-primary/30 bg-primary/[0.07] px-4 py-3 text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
            <span>
              Removed <span data-numeric>{cleaned}</span> duplicate{' '}
              {cleaned === 1 ? 'card' : 'cards'}. Every problem is now queued once.
            </span>
          </div>
        )}

        {backfill && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-3 rounded-[var(--radius)] border border-primary/25 bg-primary/[0.05] p-4"
          >
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="space-y-1 text-sm">
                <p className="font-medium">
                  {backfill.scheduled > 0
                    ? `Added ${backfill.scheduled} problem${backfill.scheduled === 1 ? '' : 's'} from the last ${backfill.days} days`
                    : `Nothing new from the last ${backfill.days} days`}
                </p>
                <p className="text-muted-foreground">
                  Each one is scheduled from when you solved it, so the oldest comes up first.
                  {backfill.skipped > 0 && ` ${backfill.skipped} already tracked.`}
                  {backfill.duplicatesCollapsed > 0 &&
                    ` ${backfill.duplicatesCollapsed} duplicate file${backfill.duplicatesCollapsed === 1 ? '' : 's'} collapsed.`}
                </p>
              </div>
            </div>
            {backfill.problems.length > 0 && (
              <ul className="space-y-1.5 border-t border-border pt-3 pl-7">
                {backfill.problems.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium">{formatProblemTitle(p.title)}</span>
                    {p.pattern && <Badge variant="code">{patternLabel(p.pattern)}</Badge>}
                    <span className="font-mono text-xs text-muted-foreground">
                      solved {formatRelativeDate(p.solvedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}

        {/* One instrument strip rather than three competing cards. */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 grid grid-cols-1 divide-y divide-border overflow-hidden rounded-[var(--radius)] border border-border bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0"
        >
          {stats.map((stat) => (
            <button
              key={stat.key}
              type="button"
              onClick={() => setFilter(stat.key)}
              aria-pressed={filter === stat.key}
              className={cn(
                'group relative flex flex-col gap-1 px-5 py-4 text-left transition-colors hover:bg-surface-raised',
                filter === stat.key && 'bg-surface-raised',
              )}
            >
              <span className="flex items-center gap-1.5">
                <stat.icon className={cn('h-3.5 w-3.5', stat.tone)} />
                <span className="eyebrow">{stat.label}</span>
              </span>
              <span data-numeric className="font-display text-3xl font-semibold leading-none">
                {loading ? '—' : stat.value}
              </span>
              <span className="text-xs text-muted-foreground">{stat.sub}</span>
              {filter === stat.key && (
                <span className="absolute inset-x-0 top-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </motion.div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-lg font-semibold">
              {FILTERS.find((f) => f.key === filter)?.label}
            </h2>
            <span data-numeric className="font-mono text-sm text-muted-foreground">
              {shown.length} {shown.length === 1 ? 'problem' : 'problems'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter by title or pattern"
                aria-label="Filter the queue"
                className="h-8 w-52 pl-9 text-xs"
              />
            </div>

            <div
              role="tablist"
              aria-label="Filter revisions"
              className="flex items-center gap-0.5 rounded-md border border-border bg-surface p-0.5"
            >
            {FILTERS.map((f) => (
              <button
                key={f.key}
                role="tab"
                aria-selected={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                  filter === f.key
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[5.5rem] w-full rounded-[var(--radius)]" />
              ))}
            </div>
          ) : shown.length === 0 ? (
            <Card className="border-dashed">
              <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface-raised">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </span>
                <div className="space-y-1">
                  <p className="font-display text-base font-semibold">
                    {needle
                      ? `Nothing matches "${query.trim()}"`
                      : filter === 'due'
                      ? 'Nothing due. Nice work.'
                      : filter === 'upcoming'
                        ? 'No upcoming reviews scheduled'
                        : filter === 'mastered'
                          ? 'Nothing mastered yet'
                          : 'No problems tracked yet'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {needle
                      ? 'Clear the filter to see the rest of the queue.'
                      : filter === 'mastered'
                      ? `A problem counts as mastered once its interval passes ${MASTERY_INTERVAL_DAYS} days.`
                      : 'Track problems from your library to build a review queue.'}
                  </p>
                </div>
                <Link href="/problems">
                  <Button variant="outline">
                    Browse problems
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <ul className="space-y-2">
              {shown.map((revision, i) => (
                <motion.li
                  key={revision.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: Math.min(i * 0.03, 0.24),
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <RevisionRow revision={revision} now={now} />
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
