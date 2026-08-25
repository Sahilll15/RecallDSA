'use client';


import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Crosshair, RotateCcw, Target, XCircle } from 'lucide-react';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PATTERNS, patternLabel } from '@/lib/constants';
import { PATTERN_TRIGGERS, drillOrder, type PatternTrigger } from '@/lib/pattern-triggers';
import { cn } from '@/lib/utils';

interface Weakness {
  patterns: Array<{ pattern: string; attempts: number; struggles: number }>;
}

const DECK_SIZE = 10;

export default function TriggerDrillPage() {
  const [deck, setDeck] = useState<PatternTrigger[] | null>(null);
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState<PatternTrigger[]>([]);

  const build = useCallback(async () => {
    let weakness = new Map<string, { attempts: number; struggles: number }>();
    try {
      const res = await fetch('/api/stats/pattern-weakness');
      if (res.ok) {
        const data: Weakness = await res.json();
        weakness = new Map(data.patterns.map((p) => [p.pattern, p]));
      }
    } catch {
      // Ordering is a nicety; the drill works without it.
    }
    setDeck(drillOrder(PATTERN_TRIGGERS, weakness).slice(0, DECK_SIZE));
  }, []);

  useEffect(() => {
    build();
  }, [build]);

  const current = deck?.[index] ?? null;
  const correct = revealed && guess === current?.pattern;

  const restart = () => {
    setIndex(0);
    setGuess('');
    setRevealed(false);
    setHits(0);
    setMisses([]);
    setDeck(null);
    build();
  };

  const next = () => {
    if (!current) return;
    if (guess === current.pattern) setHits((n) => n + 1);
    else setMisses((m) => [...m, current]);
    setIndex((i) => i + 1);
    setGuess('');
    setRevealed(false);
  };

  const sortedPatterns = useMemo(
    () => [...PATTERNS].sort((a, b) => a.label.localeCompare(b.label)),
    [],
  );

  const done = deck !== null && index >= deck.length;

  return (
    <div className="relative flex min-h-screen flex-col">
      <AnimatedBackground />
      <Header />

      <main className="container relative mx-auto max-w-3xl flex-1 space-y-6 px-4 py-10">
        <header className="space-y-2">
          <p className="eyebrow flex items-center gap-1.5">
            <Crosshair className="h-3.5 w-3.5 text-primary" />
            Trigger drill
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Name the pattern
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Reading a solution rehearses code nobody will ask you to reproduce. This drills the
            decision you actually have to make: given the shape of a problem, which technique
            applies. Weakest patterns come up first.
          </p>
        </header>

        {deck === null ? (
          <Skeleton className="h-64 w-full rounded-[var(--radius)]" />
        ) : done ? (
          <Card>
            <CardContent className="space-y-5 p-8 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary-soft">
                <Target className="h-6 w-6 text-primary" />
              </span>
              <div className="space-y-1">
                <p className="font-display text-2xl font-semibold">
                  <span data-numeric>
                    {hits}/{deck.length}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {hits === deck.length
                    ? 'Every trigger named. That is the part that transfers to a new problem.'
                    : 'The ones you missed are worth practising on real problems, not re-reading here.'}
                </p>
              </div>

              {misses.length > 0 && (
                <div className="space-y-2 text-left">
                  <p className="eyebrow">Go and practise these</p>
                  {misses.map((miss) => (
                    <Link
                      key={miss.pattern}
                      href={`/problems?pattern=${miss.pattern}`}
                      className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2 text-sm transition-colors hover:border-border-strong hover:bg-surface-raised"
                    >
                      <span className="font-medium">{patternLabel(miss.pattern)}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        Problems
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={restart}>
                  <RotateCcw className="h-4 w-4" />
                  Again
                </Button>
                <Link href="/revision">
                  <Button>
                    Back to revision
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          current && (
            <>
              <div className="flex items-center justify-between gap-4">
                <div className="flex gap-1">
                  {deck.map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        'h-1 w-6 rounded-full',
                        i < index ? 'bg-primary' : i === index ? 'bg-primary/50' : 'bg-border-strong/60',
                      )}
                    />
                  ))}
                </div>
                <span data-numeric className="font-mono text-sm text-muted-foreground">
                  {hits} correct
                </span>
              </div>

              <Card>
                <CardContent className="space-y-5 p-6">
                  <div className="space-y-2">
                    <p className="eyebrow">What you notice in the statement</p>
                    <p className="text-lg leading-relaxed">{current.features}</p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="guess" className="text-sm font-medium">
                      Which pattern is this?
                    </label>
                    <select
                      id="guess"
                      value={guess}
                      onChange={(e) => setGuess(e.target.value)}
                      disabled={revealed}
                      className="flex h-11 w-full rounded-md border border-input bg-surface px-3 text-sm transition-colors hover:border-border-strong disabled:opacity-70"
                    >
                      <option value="">Choose a pattern</option>
                      {sortedPatterns.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {!revealed ? (
                    <Button
                      size="lg"
                      className="w-full"
                      disabled={!guess}
                      onClick={() => setRevealed(true)}
                    >
                      Check
                    </Button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <div
                        className={cn(
                          'flex items-start gap-2.5 rounded-md border p-4',
                          correct
                            ? 'border-primary/30 bg-primary-soft'
                            : 'border-destructive/30 bg-destructive-soft',
                        )}
                      >
                        {correct ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        ) : (
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                        )}
                        <div className="space-y-1">
                          <p className="font-medium">
                            {correct ? 'Correct' : patternLabel(current.pattern)}
                          </p>
                          {!correct && (
                            <p className="text-sm text-muted-foreground">
                              You said {patternLabel(guess)}.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="surface-panel p-4">
                        <p className="eyebrow mb-1.5">Why it works</p>
                        <p className="text-sm leading-relaxed">{current.mechanism}</p>
                      </div>

                      <Button size="lg" className="w-full" onClick={next}>
                        {index === deck.length - 1 ? 'Finish' : 'Next trigger'}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              <p className="text-center text-xs text-muted-foreground">
                <Badge variant="code">{index + 1}</Badge> of {deck.length} in this deck
              </p>
            </>
          )
        )}
      </main>

      <Footer />
    </div>
  );
}
