'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ExternalLink,
  Eye,
  Lightbulb,
  Lock,
  RotateCcw,
  Timer,
} from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PATTERNS, patternLabel } from '@/lib/constants';
import { triggerFor } from '@/lib/pattern-triggers';
import {
  TIER_LABELS,
  TIME_BUDGET_MIN,
  type LadderProblem,
  type LadderRung,
} from '@/lib/pattern-ladder';
import {
  DEBT_DAYS,
  OUTCOME_HELP,
  OUTCOME_LABELS,
  SOLVE_OUTCOMES,
  type SolveOutcome,
} from '@/lib/practice';
import { formatClock, phaseAt, phasesFor } from '@/lib/solve-protocol';
import { cn } from '@/lib/utils';

interface Statement {
  available: boolean;
  slug: string;
  number?: string;
  title: string;
  difficulty?: string | null;
  hints?: string[];
  url: string;
  contentHtml?: string;
}

interface AttemptRecord {
  id: string;
  outcome: string;
  durationSec: number | null;
  patternGuess: string | null;
  createdAt: string;
  owes: boolean;
}

const OUTCOME_TONE: Record<SolveOutcome, string> = {
  unaided: 'border-primary/40 hover:bg-primary-soft',
  hinted: 'border-info/40 hover:bg-info-soft',
  editorial: 'border-warning/40 hover:bg-warning-soft',
  failed: 'border-destructive/40 hover:bg-destructive-soft',
};

function timerKey(slug: string): string {
  return `recalldsa:practice-timer:${slug}`;
}

export function SolveClient({
  user,
  rung,
  problem,
  history,
}: {
  user: { name?: string | null; email?: string | null };
  rung: LadderRung;
  problem: LadderProblem;
  history: AttemptRecord[];
}) {
  const router = useRouter();
  const phases = useMemo(() => phasesFor(problem.difficulty), [problem.difficulty]);

  const [statement, setStatement] = useState<Statement | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [guess, setGuess] = useState('');
  const [guessLocked, setGuessLocked] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState<SolveOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const statementRef = useRef<HTMLDivElement>(null);

  const owed = history.find((attempt) => attempt.owes);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/practice/statement/${problem.slug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) {
          setStatement(
            data ?? {
              available: false,
              slug: problem.slug,
              title: problem.title,
              url: `https://leetcode.com/problems/${problem.slug}/`,
            },
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatement({
            available: false,
            slug: problem.slug,
            title: problem.title,
            url: `https://leetcode.com/problems/${problem.slug}/`,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [problem.slug, problem.title]);

  // The clock survives a reload: losing it mid-attempt would mean guessing the
  // duration, and an invented duration corrupts the pace check.
  useEffect(() => {
    const stored = window.localStorage.getItem(timerKey(problem.slug));
    if (stored) {
      const at = Number(stored);
      if (Number.isFinite(at) && at > 0) setStartedAt(at);
    }
  }, [problem.slug]);

  useEffect(() => {
    if (startedAt === null) return;
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);

  const start = () => {
    const now = Date.now();
    window.localStorage.setItem(timerKey(problem.slug), String(now));
    setStartedAt(now);
  };

  const reset = () => {
    window.localStorage.removeItem(timerKey(problem.slug));
    setStartedAt(null);
    setElapsed(0);
    setHintsShown(0);
  };

  const phase = phaseAt(phases, elapsed);
  const running = startedAt !== null;
  const budget = TIME_BUDGET_MIN[problem.difficulty];

  // Hints and the editorial stay shut until the clock reaches them. The point
  // of the protocol is that help arrives on a schedule, not on an impulse.
  const helpUnlocked = running && (phase.id === 'hint' || phase.id === 'editorial');
  const editorialUnlocked = running && phase.id === 'editorial';
  const hints = statement?.hints ?? [];

  const log = useCallback(
    async (outcome: SolveOutcome) => {
      setSaving(outcome);
      setError(null);
      try {
        const res = await fetch('/api/practice/attempt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: problem.slug,
            outcome,
            durationSec: running ? elapsed : null,
            patternGuess: guess || null,
            notes: notes.trim() || null,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? 'Could not save that attempt');
        }
        window.localStorage.removeItem(timerKey(problem.slug));
        router.push('/practice');
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Could not save that attempt');
        setSaving(null);
      }
    },
    [elapsed, guess, notes, problem.slug, router, running],
  );

  const sortedPatterns = useMemo(
    () => [...PATTERNS].sort((a, b) => a.label.localeCompare(b.label)),
    [],
  );

  const guessedTrigger = guessLocked && guess ? triggerFor(guess) : undefined;

  return (
    <div className="relative flex min-h-screen flex-col">
      <AnimatedBackground />
      <Header user={user} />

      <main className="container relative mx-auto max-w-3xl flex-1 space-y-5 px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/practice"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Practice
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="code">{rung.name}</Badge>
            <Badge variant="outline">{TIER_LABELS[problem.tier]}</Badge>
          </div>
        </div>

        <header className="space-y-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            <span data-numeric className="text-muted-foreground">
              {problem.number}.
            </span>{' '}
            {problem.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {problem.difficulty} &middot; {budget} minute budget before any help
          </p>
        </header>

        {owed && (
          <div className="flex items-start gap-2.5 rounded-md border border-warning/40 bg-warning-soft p-4">
            <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <p className="text-sm">
              This one is owed. You logged it as {OUTCOME_LABELS[owed.outcome as SolveOutcome]}{' '}
              last time, so derive it from blank now. Nothing below reveals anything you have not
              earned this attempt.
            </p>
          </div>
        )}

        {/* The clock and the phase rail: the stopping rule, made visible. */}
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-baseline gap-3">
                <span
                  data-numeric
                  className={cn(
                    'font-display text-4xl font-semibold leading-none tabular',
                    phase.id === 'editorial' && running && 'text-warning',
                  )}
                >
                  {formatClock(elapsed)}
                </span>
                {running && (
                  <span className="text-sm text-muted-foreground">{phase.label}</span>
                )}
              </div>

              {running ? (
                <Button variant="ghost" size="sm" onClick={reset}>
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </Button>
              ) : (
                <Button onClick={start}>
                  <Timer className="h-4 w-4" />
                  Start the clock
                </Button>
              )}
            </div>

            <ol className="grid grid-cols-5 gap-1">
              {phases.map((p) => {
                const active = running && p.id === phase.id;
                const done = running && p.endMin !== null && elapsed / 60 >= p.endMin;
                return (
                  <li key={p.id} className="space-y-1.5">
                    <span
                      className={cn(
                        'block h-1 rounded-full',
                        active ? 'bg-primary' : done ? 'bg-primary/40' : 'bg-border-strong/70',
                      )}
                    />
                    <span
                      className={cn(
                        'block font-mono text-[0.625rem] uppercase tracking-wide',
                        active ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {p.label}
                    </span>
                  </li>
                );
              })}
            </ol>

            {running && (
              <motion.p
                key={phase.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm leading-relaxed text-foreground/90"
              >
                {phase.instruction}
              </motion.p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-5">
            <p className="eyebrow">The question</p>
            {statement === null ? (
              <Skeleton className="h-48 w-full rounded-md" />
            ) : statement.available ? (
              <>
                <div
                  ref={statementRef}
                  className="problem-statement max-h-[26rem] overflow-y-auto pr-1"
                  dangerouslySetInnerHTML={{ __html: statement.contentHtml ?? '' }}
                />
                <a
                  href={statement.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary underline underline-offset-2"
                >
                  Solve it on LeetCode
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  LeetCode did not return the statement. Open it directly.
                </p>
                <a
                  href={statement.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary underline underline-offset-2"
                >
                  {problem.title}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Not a recognition test: you arrived here from a labelled rung, so the
            pattern is already on screen. This rehearses the trigger sentence,
            and the blind diagnostic is where recognition is actually measured. */}
        <Card>
          <CardContent className="space-y-3 p-5">
            <p className="eyebrow">Say the trigger out loud before you code</p>
            <p className="text-sm text-muted-foreground">
              You already know the pattern from the rung you came in on. Commit to it anyway and
              read your own trigger back, so the words are rehearsed for a problem that arrives
              with no heading above it.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                aria-label="Which pattern is this?"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                disabled={guessLocked}
                className="flex h-11 flex-1 rounded-md border border-input bg-surface px-3 text-sm transition-colors hover:border-border-strong disabled:opacity-70"
              >
                <option value="">Choose a pattern</option>
                {sortedPatterns.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                disabled={!guess || guessLocked}
                onClick={() => setGuessLocked(true)}
              >
                Lock it in
              </Button>
            </div>

            {guessedTrigger && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="surface-panel space-y-1 p-4"
              >
                <p className="eyebrow">
                  Your trigger for {patternLabel(guessedTrigger.pattern)}
                </p>
                <p className="text-sm leading-relaxed">{guessedTrigger.features}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {guessedTrigger.mechanism}
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="eyebrow flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5" />
                Help
              </p>
              {!helpUnlocked && (
                <span className="flex items-center gap-1.5 font-mono text-[0.6875rem] text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  opens at {phases[3].startMin}m
                </span>
              )}
            </div>

            {hints.length > 0 ? (
              <div className="space-y-2">
                {hints.slice(0, hintsShown).map((hint, i) => (
                  <div key={i} className="surface-panel p-3">
                    <p
                      className="problem-statement text-sm"
                      dangerouslySetInnerHTML={{ __html: hint }}
                    />
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!helpUnlocked || hintsShown >= hints.length}
                  onClick={() => setHintsShown((n) => n + 1)}
                >
                  <Eye className="h-3.5 w-3.5" />
                  {hintsShown === 0
                    ? `Reveal a hint (${hints.length} available)`
                    : hintsShown >= hints.length
                      ? 'No hints left'
                      : 'One more hint'}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                This problem ships no hints. When the clock reaches {phases[4].startMin} minutes,
                read the editorial, close it, and re-derive.
              </p>
            )}

            <a
              href={`${statement?.url ?? `https://leetcode.com/problems/${problem.slug}/`}solutions/`}
              target="_blank"
              rel="noreferrer"
              className={cn(
                'inline-flex items-center gap-1.5 text-sm underline underline-offset-2',
                editorialUnlocked
                  ? 'text-warning'
                  : 'pointer-events-none text-muted-foreground opacity-60',
              )}
              aria-disabled={!editorialUnlocked}
            >
              Editorial
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="space-y-1">
              <p className="eyebrow">How did it actually go</p>
              <p className="text-sm text-muted-foreground">
                This is the only figure the readiness checks trust, so it is worth being hard on
                yourself here.
              </p>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="What you got wrong, or the step you could not see. Optional."
              className="w-full rounded-md border border-input bg-surface p-3 text-sm transition-colors hover:border-border-strong"
            />

            <div className="grid gap-2 sm:grid-cols-2">
              {SOLVE_OUTCOMES.map((outcome) => {
                const days = DEBT_DAYS[outcome];
                return (
                  <button
                    key={outcome}
                    type="button"
                    disabled={saving !== null}
                    onClick={() => log(outcome)}
                    className={cn(
                      'space-y-1 rounded-md border bg-surface p-3 text-left transition-colors disabled:opacity-60',
                      OUTCOME_TONE[outcome],
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{OUTCOME_LABELS[outcome]}</span>
                      <span className="font-mono text-[0.6875rem] text-muted-foreground">
                        {days === null ? 'no debt' : `back in ${days}d`}
                      </span>
                    </span>
                    <span className="block text-xs leading-relaxed text-muted-foreground">
                      {OUTCOME_HELP[outcome]}
                    </span>
                  </button>
                );
              })}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>

        {history.length > 0 && (
          <Card>
            <CardContent className="space-y-2 p-5">
              <p className="eyebrow">Earlier attempts</p>
              <ul className="space-y-1.5">
                {history.map((attempt) => (
                  <li
                    key={attempt.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span>{OUTCOME_LABELS[attempt.outcome as SolveOutcome]}</span>
                    <span className="flex items-center gap-3 text-xs text-muted-foreground">
                      {attempt.patternGuess && (
                        <span>said {patternLabel(attempt.patternGuess)}</span>
                      )}
                      {attempt.durationSec !== null && (
                        <span data-numeric>{Math.round(attempt.durationSec / 60)}m</span>
                      )}
                      <span data-numeric>
                        {new Date(attempt.createdAt).toLocaleDateString()}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
