'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RatingButtons } from '@/components/rating-buttons';
import { CodeViewer } from '@/components/code-viewer';
import { ProblemStatement } from '@/components/problem-statement';
import { Footer } from '@/components/footer';
import { getDifficultyColor, getPlatformColor, cn, formatProblemTitle } from '@/lib/utils';
import { PATTERNS, patternLabel } from '@/lib/constants';
import type { RecallRating, SchedulingState } from '@/lib/spaced-repetition';
import {
  ArrowRight,
  Brain,
  CheckCircle,
  Eye,
  Lightbulb,
  PenLine,
  Timer,
  XCircle,
} from 'lucide-react';

interface QueueItem extends SchedulingState {
  id: string;
  nextDate: string;
  problem: {
    id: string;
    title: string;
    platform: string | null;
    difficulty: string | null;
    pattern: string | null;
    language: string | null;
    recallNote: {
      keyIdea: string | null;
      approach: string | null;
      edgeCases: string | null;
      complexity: string | null;
      hints: string[];
    } | null;
  };
}

type Stage = 'pattern' | 'plan' | 'code' | 'rate';

const STAGES: Array<{ key: Stage; label: string }> = [
  { key: 'pattern', label: 'Pattern' },
  { key: 'plan', label: 'Approach' },
  { key: 'code', label: 'Solution' },
  { key: 'rate', label: 'Rate' },
];

function formatClock(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function RecallSessionPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<Stage>('pattern');
  const [submitting, setSubmitting] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  const [patternGuess, setPatternGuess] = useState('');
  const [patternRevealed, setPatternRevealed] = useState(false);
  const [patternRecognized, setPatternRecognized] = useState<boolean | null>(null);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [notesRevealed, setNotesRevealed] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [codeRevealed, setCodeRevealed] = useState(false);
  const [explanation, setExplanation] = useState('');

  const [elapsedSec, setElapsedSec] = useState(0);
  const startRef = useRef<number>(Date.now());

  const current = queue[index] ?? null;

  useEffect(() => {
    fetch('/api/revisions?filter=due')
      .then((r) => r.json())
      .then((data) => setQueue(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setInterval(
      () => setElapsedSec(Math.floor((Date.now() - startRef.current) / 1000)),
      1000,
    );
    return () => clearInterval(timer);
  }, []);

  const resetForProblem = useCallback(() => {
    setStage('pattern');
    setPatternGuess('');
    setPatternRevealed(false);
    setPatternRecognized(null);
    setHintsRevealed(0);
    setNotesRevealed(false);
    setCode(null);
    setCodeRevealed(false);
    setExplanation('');
    startRef.current = Date.now();
    setElapsedSec(0);
  }, []);

  const revealPattern = () => {
    setPatternRevealed(true);
    if (current?.problem.pattern && patternGuess) {
      setPatternRecognized(patternGuess === current.problem.pattern);
    }
  };

  const revealCode = async () => {
    setCodeRevealed(true);
    if (!current || code !== null) return;
    try {
      const res = await fetch(`/api/problems/${current.problem.id}`);
      const data = await res.json();
      setCode(typeof data.content === 'string' ? data.content : '');
    } catch {
      setCode('');
    }
  };

  const rate = async (rating: RecallRating) => {
    if (!current || submitting) return;
    setSubmitting(true);
    try {
      await fetch(`/api/revisions/${current.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          patternRecognized,
          hintsUsed: hintsRevealed,
          durationSec: elapsedSec,
          explanation: explanation || undefined,
        }),
      });
      setReviewed((n) => n + 1);
      setIndex((i) => i + 1);
      resetForProblem();
    } finally {
      setSubmitting(false);
    }
  };

  // The handler lives in a ref so the one-second timer tick does not detach and
  // reattach the window listener on every render.
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});

  keyHandler.current = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
      if (!current || submitting) return;

      if (stage === 'rate') {
        const ratings: RecallRating[] = ['again', 'hard', 'good', 'easy'];
        const index = Number(event.key) - 1;
        if (index >= 0 && index < ratings.length) {
          event.preventDefault();
          rate(ratings[index]);
        }
        return;
      }

      if (event.key !== ' ' && event.key !== 'Enter') return;
      event.preventDefault();

      if (stage === 'pattern') {
        if (!patternRevealed) revealPattern();
        else if (patternRecognized !== null) setStage('plan');
        return;
      }
      if (stage === 'plan') {
        if (!notesRevealed) setNotesRevealed(true);
        else setStage('code');
        return;
      }
      if (stage === 'code') {
        if (!codeRevealed) revealCode();
        else setStage('rate');
      }
  };

  useEffect(() => {
    const listener = (event: KeyboardEvent) => keyHandler.current(event);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  const note = current?.problem.recallNote ?? null;
  const hints = note?.hints ?? [];
  const stageIndex = STAGES.findIndex((s) => s.key === stage);

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <Header />

      <main className="container relative mx-auto max-w-3xl px-4 py-8 space-y-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/2 rounded-lg" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : !current ? (
          <Card className="border-dashed">
            <CardContent className="space-y-4 p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="mb-1 font-display text-xl font-semibold">
                  {reviewed > 0 ? 'Session complete' : 'Nothing due right now'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {reviewed > 0
                    ? `You recalled ${reviewed} problem${reviewed === 1 ? '' : 's'}. Come back when the next reviews are due.`
                    : 'Your review queue is clear. Solve something new or check back tomorrow.'}
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <Link href="/revision">
                  <Button variant="outline">Back to Revision</Button>
                </Link>
                <Link href="/dashboard">
                  <Button>
                    Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/30 bg-primary/10">
                  <Brain className="h-4 w-4 text-primary" />
                </span>
                <div>
                  <p className="eyebrow">Recall session</p>
                  <p data-numeric className="font-mono text-sm font-medium">
                    {index + 1} / {queue.length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5">
                <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                <span data-numeric className="font-mono text-sm font-medium">
                  {formatClock(elapsedSec)}
                </span>
              </div>
            </div>

            {/* Stage track doubles as a legend: you can always see what is next. */}
            <div className="space-y-2">
              <div className="flex gap-1">
                {STAGES.map((s, i) => (
                  <div
                    key={s.key}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors duration-200',
                      i <= stageIndex ? 'bg-primary' : 'bg-border-strong/60',
                    )}
                  />
                ))}
              </div>
              <div className="flex gap-1">
                {STAGES.map((s, i) => (
                  <span
                    key={s.key}
                    className={cn(
                      'flex-1 font-mono text-[0.6875rem] uppercase tracking-[0.12em] transition-colors',
                      i === stageIndex
                        ? 'font-medium text-foreground'
                        : i < stageIndex
                          ? 'text-primary'
                          : 'text-muted-foreground/60',
                    )}
                  >
                    {s.label}
                  </span>
                ))}
              </div>
            </div>

            <Card>
              <CardHeader>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  {current.problem.platform && (
                    <Badge className={getPlatformColor(current.problem.platform)}>
                      {current.problem.platform}
                    </Badge>
                  )}
                  {current.problem.difficulty && (
                    <Badge className={getDifficultyColor(current.problem.difficulty)}>
                      {current.problem.difficulty}
                    </Badge>
                  )}
                </div>
                <CardTitle className="font-display text-2xl">
                  {formatProblemTitle(current.problem.title)}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="rounded-md border border-border bg-surface-raised/40 p-4">
                  <ProblemStatement problemId={current.problem.id} defaultOpen />
                </div>

                {stage === 'pattern' && (
                  <div className="space-y-4">
                    <p className="font-semibold">
                      Before anything else: what pattern is this?
                    </p>
                    <select
                      value={patternGuess}
                      onChange={(e) => setPatternGuess(e.target.value)}
                      disabled={patternRevealed}
                      className="flex h-11 w-full rounded-md border border-input bg-surface px-3 text-sm transition-colors hover:border-border-strong"
                    >
                      <option value="">I&apos;m not sure yet...</option>
                      {PATTERNS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>

                    {!patternRevealed ? (
                      <Button onClick={revealPattern} className="w-full" size="lg">
                        <Eye className="h-4 w-4 mr-2" />
                        Reveal pattern
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <div className="surface-panel p-4">
                          <p className="eyebrow mb-1">Stored pattern</p>
                          <p className="font-display text-lg font-semibold text-primary">
                            {patternLabel(current.problem.pattern)}
                          </p>
                        </div>
                        {patternRecognized === null && (
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Did you recognize the pattern before revealing?
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant="outline"
                                onClick={() => setPatternRecognized(true)}
                                className="border-primary/40 text-primary hover:bg-primary/10"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Yes
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setPatternRecognized(false)}
                                className="border-destructive/40 text-destructive hover:bg-destructive/10"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                No
                              </Button>
                            </div>
                          </div>
                        )}
                        {patternRecognized !== null && (
                          <Button onClick={() => setStage('plan')} className="w-full" size="lg">
                            Next: reconstruct the approach
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {stage === 'plan' && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="font-semibold">Reconstruct the approach in your head:</p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                        <li>What is the key idea or search space?</li>
                        <li>How do you check whether a candidate works?</li>
                        <li>Which edge cases matter?</li>
                      </ul>
                    </div>

                    {hints.length > 0 && hintsRevealed < hints.length && !notesRevealed && (
                      <Button
                        variant="outline"
                        onClick={() => setHintsRevealed((n) => n + 1)}
                        className="w-full"
                      >
                        <Lightbulb className="h-4 w-4 mr-2" />
                        Need a hint? ({hintsRevealed}/{hints.length} used)
                      </Button>
                    )}
                    {hintsRevealed > 0 && (
                      <div className="space-y-2">
                        {hints.slice(0, hintsRevealed).map((hint, i) => (
                          <div
                            key={i}
                            className="rounded-md border border-warning/30 bg-warning-soft p-3 text-sm"
                          >
                            <span className="mr-2 font-mono text-xs font-semibold uppercase tracking-wider text-warning">
                              Hint {i + 1}
                            </span>
                            {hint}
                          </div>
                        ))}
                      </div>
                    )}

                    {!notesRevealed ? (
                      <Button onClick={() => setNotesRevealed(true)} className="w-full" size="lg">
                        <Eye className="h-4 w-4 mr-2" />
                        Reveal my stored reasoning
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        {note && (note.keyIdea || note.approach || note.edgeCases || note.complexity) ? (
                          <div className="space-y-3">
                            {note.keyIdea && (
                              <div className="surface-panel p-4">
                                <p className="eyebrow mb-1.5">Key idea</p>
                                <p className="text-sm whitespace-pre-wrap">{note.keyIdea}</p>
                              </div>
                            )}
                            {note.approach && (
                              <div className="surface-panel p-4">
                                <p className="eyebrow mb-1.5">Approach / validation</p>
                                <p className="text-sm whitespace-pre-wrap">{note.approach}</p>
                              </div>
                            )}
                            {note.edgeCases && (
                              <div className="surface-panel p-4">
                                <p className="eyebrow mb-1.5">Edge cases</p>
                                <p className="text-sm whitespace-pre-wrap">{note.edgeCases}</p>
                              </div>
                            )}
                            {note.complexity && (
                              <div className="surface-panel p-4">
                                <p className="eyebrow mb-1.5">Complexity</p>
                                <p className="text-sm">{note.complexity}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                            No recall note yet for this problem. After the session, open the
                            problem and write down the key idea, validation function, and edge
                            cases, and future recall sessions get much more useful.
                          </div>
                        )}
                        <Button onClick={() => setStage('code')} className="w-full" size="lg">
                          Next: the solution
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {stage === 'code' && (
                  <div className="space-y-4">
                    <p className="font-semibold">
                      Could you write it from scratch? Sketch it mentally, then compare.
                    </p>
                    {!codeRevealed ? (
                      <Button onClick={revealCode} className="w-full" size="lg">
                        <Eye className="h-4 w-4 mr-2" />
                        Reveal my solution
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        {code === null ? (
                          <Skeleton className="h-48 w-full rounded-lg" />
                        ) : code ? (
                          <div className="max-h-96 overflow-y-auto overflow-hidden rounded-md border border-border">
                            <CodeViewer code={code} language={current.problem.language} />
                          </div>
                        ) : (
                          <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                            Could not load the solution file from GitHub.
                          </div>
                        )}
                        <Button onClick={() => setStage('rate')} className="w-full" size="lg">
                          Next: rate your recall
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {stage === 'rate' && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <p className="font-semibold flex items-center gap-2">
                        <PenLine className="h-4 w-4" />
                        Explain why this solution works (optional)
                      </p>
                      <textarea
                        value={explanation}
                        onChange={(e) => setExplanation(e.target.value)}
                        rows={3}
                        placeholder="e.g. We binary search the eating speed because increasing speed monotonically decreases required hours..."
                        className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm transition-colors hover:border-border-strong"
                      />
                    </div>

                    <div className="space-y-2">
                      <p className="font-semibold">How well did you recall it?</p>
                      <RatingButtons
                        state={{
                          intervalDays: current.intervalDays,
                          easeFactor: current.easeFactor,
                          repetitions: current.repetitions,
                          lapses: current.lapses,
                        }}
                        onRate={rate}
                        disabled={submitting}
                      />
                      <p className="text-center text-xs text-muted-foreground">
                        <kbd className="rounded border border-border px-1 font-mono">1</kbd>
                        {' to '}
                        <kbd className="rounded border border-border px-1 font-mono">4</kbd>
                        {' rates without the mouse. '}
                        {hintsRevealed > 0
                          ? `You used ${hintsRevealed} hint${hintsRevealed === 1 ? '' : 's'}, so be honest with the rating.`
                          : 'The buttons show when the problem comes back.'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
