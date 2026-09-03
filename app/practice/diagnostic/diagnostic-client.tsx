'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Crosshair,
  RotateCcw,
  Target,
  XCircle,
} from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PATTERNS } from '@/lib/constants';
import { rungById } from '@/lib/pattern-ladder';
import { cn } from '@/lib/utils';

interface DeckItem {
  slug: string;
  number: string;
  title: string;
  difficulty: string;
  rungId: string;
}

interface Deck {
  runId: string;
  secondsPerItem: number;
  items: DeckItem[];
}

interface Result {
  slug: string;
  rungId: string;
  pattern: string;
  patternLabel: string;
  guess: string | null;
  guessLabel: string | null;
  correct: boolean;
}

interface Answer {
  slug: string;
  guess: string | null;
  seconds: number;
}

export function DiagnosticClient({
  user,
}: {
  user: { name?: string | null; email?: string | null };
}) {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState('');
  const [remaining, setRemaining] = useState(0);
  const [statements, setStatements] = useState<Record<string, string | null>>({});
  const [results, setResults] = useState<{ score: number; total: number; items: Result[] } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const answers = useRef<Answer[]>([]);

  const load = useCallback(async () => {
    setDeck(null);
    setError(null);
    try {
      const res = await fetch('/api/practice/diagnostic/deck');
      if (!res.ok) throw new Error('Could not build a deck');
      setDeck(await res.json());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not build a deck');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const current = deck && started ? deck.items[index] : null;

  // Fetch the statement on show, and the next one behind it, so a locked answer
  // is never waiting on the network.
  useEffect(() => {
    if (!deck || !started) return;
    const wanted = [deck.items[index], deck.items[index + 1]].filter(Boolean) as DeckItem[];
    for (const item of wanted) {
      if (item.slug in statements) continue;
      setStatements((prev) => ({ ...prev, [item.slug]: null }));
      fetch(`/api/practice/statement/${item.slug}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) =>
          setStatements((prev) => ({
            ...prev,
            [item.slug]: data?.available ? (data.contentHtml as string) : '',
          })),
        )
        .catch(() => setStatements((prev) => ({ ...prev, [item.slug]: '' })));
    }
  }, [deck, started, index, statements]);

  const submit = useCallback(
    async (finalAnswers: Answer[]) => {
      if (!deck) return;
      setSubmitting(true);
      try {
        const res = await fetch('/api/practice/diagnostic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ runId: deck.runId, answers: finalAnswers }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? 'Could not record the run');
        }
        setResults(await res.json());
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Could not record the run');
      } finally {
        setSubmitting(false);
      }
    },
    [deck],
  );

  const advance = useCallback(
    (chosen: string) => {
      if (!deck) return;
      const item = deck.items[index];
      answers.current = [
        ...answers.current,
        {
          slug: item.slug,
          guess: chosen || null,
          seconds: Math.max(0, deck.secondsPerItem - remaining),
        },
      ];
      setGuess('');
      if (index + 1 >= deck.items.length) submit(answers.current);
      else setIndex((i) => i + 1);
    },
    [deck, index, remaining, submit],
  );

  // Each statement gets one minute. Running out is a miss, not a pause: an
  // interview does not wait either, and a slow correct call is still a gap.
  useEffect(() => {
    if (!deck || !started || results) return;
    setRemaining(deck.secondsPerItem);
    const id = window.setInterval(() => {
      setRemaining((left) => {
        if (left <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return left - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [deck, started, index, results]);

  const expiredRef = useRef(0);
  useEffect(() => {
    if (!started || results || remaining !== 0 || !deck) return;
    if (expiredRef.current === index) return;
    expiredRef.current = index;
    advance(guess);
  }, [remaining, started, results, deck, index, guess, advance]);

  const sortedPatterns = useMemo(
    () => [...PATTERNS].sort((a, b) => a.label.localeCompare(b.label)),
    [],
  );

  const restart = () => {
    answers.current = [];
    expiredRef.current = -1;
    setResults(null);
    setIndex(0);
    setGuess('');
    setStarted(false);
    setStatements({});
    load();
  };

  const statementHtml = current ? statements[current.slug] : undefined;

  return (
    <div className="relative flex min-h-screen flex-col">
      <AnimatedBackground />
      <Header user={user} />

      <main className="container relative mx-auto max-w-3xl flex-1 space-y-5 px-4 py-10">
        <Link
          href="/practice"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Practice
        </Link>

        <header className="space-y-2">
          <p className="eyebrow flex items-center gap-1.5">
            <Crosshair className="h-3.5 w-3.5 text-primary" />
            Blind diagnostic
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Name the pattern, cold
          </h1>
        </header>

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive-soft p-4 text-sm">
            {error}
          </div>
        )}

        {results ? (
          <Card>
            <CardContent className="space-y-5 p-8">
              <div className="space-y-1 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary-soft">
                  <Target className="h-6 w-6 text-primary" />
                </span>
                <p data-numeric className="font-display text-2xl font-semibold">
                  {results.score}/{results.total}
                </p>
                <p className="text-sm text-muted-foreground">
                  {results.score === results.total
                    ? 'Every pattern named on a statement you had never seen. That is the reading that transfers.'
                    : 'The misses are where practice belongs next, on real problems rather than by re-reading.'}
                </p>
              </div>

              <ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
                {results.items.map((item) => (
                  <li key={item.slug} className="flex items-start gap-2.5 px-3 py-2.5 text-sm">
                    {item.correct ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    )}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="truncate font-medium">
                        {rungById(item.rungId)?.problems.find((p) => p.slug === item.slug)
                          ?.title ?? item.slug}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.correct
                          ? item.patternLabel
                          : `${item.patternLabel}, you said ${item.guessLabel ?? 'nothing'}`}
                      </p>
                    </div>
                    {!item.correct && (
                      <Link
                        href={`/practice#${item.rungId}`}
                        className="shrink-0 text-xs text-primary underline underline-offset-2"
                      >
                        Ladder
                      </Link>
                    )}
                  </li>
                ))}
              </ul>

              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={restart}>
                  <RotateCcw className="h-4 w-4" />
                  Another deck
                </Button>
                <Link href="/practice">
                  <Button>
                    Back to practice
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : deck === null ? (
          <Skeleton className="h-64 w-full rounded-[var(--radius)]" />
        ) : !started ? (
          <Card>
            <CardContent className="space-y-4 p-6">
              <p className="text-sm leading-relaxed">
                {deck.items.length} problem statements, none of which you have solved or
                attempted. One minute each. Read it, name the pattern, move on. No coding, and no
                feedback until the end, so an early miss cannot steer the rest of the run.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Running out of time counts as a miss. That is the point: deciding slowly is the
                same problem as deciding wrongly.
              </p>
              <Button size="lg" className="w-full" onClick={() => setStarted(true)}>
                Start the run
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          current && (
            <>
              <div className="flex items-center justify-between gap-4">
                <div className="flex gap-1">
                  {deck.items.map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        'h-1 w-5 rounded-full',
                        i < index ? 'bg-primary' : i === index ? 'bg-primary/50' : 'bg-border-strong/60',
                      )}
                    />
                  ))}
                </div>
                <span
                  data-numeric
                  className={cn(
                    'font-mono text-sm tabular',
                    remaining <= 10 ? 'text-destructive' : 'text-muted-foreground',
                  )}
                >
                  {remaining}s
                </span>
              </div>

              <Card>
                <CardContent className="space-y-4 p-6">
                  {/* No title and no number: both are searchable, and a
                      recognised title is a memory, not a recognition. */}
                  <Badge variant="outline">{current.difficulty}</Badge>

                  {statementHtml === undefined || statementHtml === null ? (
                    <Skeleton className="h-40 w-full rounded-md" />
                  ) : statementHtml === '' ? (
                    <p className="text-sm text-muted-foreground">
                      LeetCode did not return this statement. Skip it and it counts as a miss.
                    </p>
                  ) : (
                    <div
                      className="problem-statement max-h-[22rem] overflow-y-auto pr-1"
                      dangerouslySetInnerHTML={{ __html: statementHtml }}
                    />
                  )}

                  <div className="space-y-2">
                    <label htmlFor="diagnostic-guess" className="text-sm font-medium">
                      Which pattern is this?
                    </label>
                    <select
                      id="diagnostic-guess"
                      value={guess}
                      onChange={(e) => setGuess(e.target.value)}
                      className="flex h-11 w-full rounded-md border border-input bg-surface px-3 text-sm transition-colors hover:border-border-strong"
                    >
                      <option value="">Choose a pattern</option>
                      {sortedPatterns.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Button
                      size="lg"
                      className="w-full"
                      disabled={submitting}
                      onClick={() => advance(guess)}
                    >
                      {index === deck.items.length - 1 ? 'Lock in and finish' : 'Lock in and next'}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>

              <p className="text-center text-xs text-muted-foreground">
                <Badge variant="code">{index + 1}</Badge> of {deck.items.length}
                {guess === '' && ' · no answer counts as a miss'}
              </p>
            </>
          )
        )}
      </main>

      <Footer />
    </div>
  );
}
