'use client';

import { Header } from '@/components/header';
import {
  AnimatedCard,
  AnimatedCardContent,
  AnimatedCardDescription,
  AnimatedCardHeader,
  AnimatedCardTitle,
} from '@/components/ui/animated-card';
import { MetricStrip } from '@/components/ui/metric-strip';
import { ActivityCalendar } from '@/components/ui/activity-calendar';
import type { ActivityCalendar as ActivityData } from '@/lib/activity';
import { ProgressBar } from '@/components/ui/progress-bar';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { patternLabel } from '@/lib/constants';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Code2,
  Calendar,
  ArrowRight,
  Target,
  Activity,
  Zap,
  Brain,
  Trophy,
  Lightbulb,
  AlertTriangle,
  Clock,
  Flame,
  TrendingUp,
} from 'lucide-react';
import { Footer } from '@/components/footer';

export interface PatternReadiness {
  pattern: string;
  tracked: number;
  mastered: number;
  attempts: number;
  struggles: number;
}

interface DashboardClientProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
  stats: {
    totalProblems: number;
    totalRevisions: number;
    dueNow: number;
    mastered: number;
    repos: number;
  };
  readiness: {
    totalAttempts: number;
    recallRate: number | null;
    patternRate: number | null;
    hintFreeRate: number | null;
    avgMinutes: number | null;
    patterns: PatternReadiness[];
    recurringConcepts: Array<{ concept: string; count: number }>;
  };
  problemsByDifficulty: Array<{
    difficulty: string | null;
    _count: number;
  }>;
  activity: ActivityData;
}

const difficultyBars: Record<string, string> = {
  easy: 'bg-success',
  medium: 'bg-warning',
  hard: 'bg-destructive',
};

export function DashboardClient({
  user,
  stats,
  readiness,
  problemsByDifficulty,
  activity,
}: DashboardClientProps) {
  const weakPatterns = readiness.patterns
    .filter((p) => p.attempts >= 2 && p.struggles / p.attempts >= 0.5)
    .slice(0, 3);

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <Header user={user} />

      <main className="container mx-auto max-w-6xl space-y-7 px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-2"
        >
          <p className="eyebrow">Dashboard</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Welcome back, {user.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Not how many you solved. How many you can reconstruct.
          </p>
        </motion.div>

        {stats.repos === 0 ? (
          <AnimatedCard className="border-dashed" delay={0.05}>
            <AnimatedCardHeader className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10"
              >
                <Code2 className="h-6 w-6 text-primary" />
              </motion.div>
              <AnimatedCardTitle className="font-display text-xl">No repository connected</AnimatedCardTitle>
              <AnimatedCardDescription className="text-base">
                Get started by connecting your DSA GitHub repository
              </AnimatedCardDescription>
            </AnimatedCardHeader>
            <AnimatedCardContent className="flex justify-center pb-6">
              <Link href="/settings">
                <Button size="lg" className="group">
                  <Zap className="h-4 w-4" />
                  Connect repository
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </AnimatedCardContent>
          </AnimatedCard>
        ) : (
          <>
            <MetricStrip
              columns={4}
              metrics={[
                {
                  label: 'Due now',
                  value: stats.dueNow,
                  sub: stats.dueNow > 0 ? 'waiting for recall' : 'queue is clear',
                  icon: Calendar,
                  tone: stats.dueNow > 0 ? 'text-destructive' : undefined,
                },
                {
                  label: 'Mastered',
                  value: stats.mastered,
                  sub: 'at 30d+ intervals',
                  icon: Trophy,
                  tone: 'text-primary',
                },
                {
                  label: 'In revision',
                  value: stats.totalRevisions,
                  sub: `of ${stats.totalProblems} problems`,
                  icon: Activity,
                },
                {
                  label: 'Problems',
                  value: stats.totalProblems,
                  sub: `${stats.repos} ${stats.repos === 1 ? 'repository' : 'repositories'}`,
                  icon: Code2,
                },
              ]}
            />

            <AnimatedCard delay={0.08}>
              <AnimatedCardHeader>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="space-y-1">
                    <p className="eyebrow flex items-center gap-1.5">
                      <Flame className="h-3.5 w-3.5 text-primary" />
                      Recall consistency
                    </p>
                    <AnimatedCardDescription>
                      Every review of the last year, one square per day
                    </AnimatedCardDescription>
                  </div>
                  <div className="flex items-center gap-5">
                    <div>
                      <p className="eyebrow">Current streak</p>
                      <p data-numeric className="font-display text-2xl font-semibold">
                        {activity.currentStreak}
                        <span className="ml-1 text-sm font-normal text-muted-foreground">
                          {activity.currentStreak === 1 ? 'day' : 'days'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="eyebrow">Longest</p>
                      <p data-numeric className="font-display text-2xl font-semibold">
                        {activity.longestStreak}
                        <span className="ml-1 text-sm font-normal text-muted-foreground">
                          {activity.longestStreak === 1 ? 'day' : 'days'}
                        </span>
                      </p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="eyebrow">Reviews</p>
                      <p data-numeric className="font-display text-2xl font-semibold">
                        {activity.total}
                      </p>
                    </div>
                  </div>
                </div>
              </AnimatedCardHeader>
              <AnimatedCardContent>
                {activity.total === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No reviews yet. Finish a recall session and the first square lights up.
                  </p>
                ) : (
                  <ActivityCalendar days={activity.days} />
                )}
              </AnimatedCardContent>
            </AnimatedCard>

            {stats.dueNow > 0 && (
              <AnimatedCard
                delay={0.1}
                className="border-primary/30 bg-primary/5"
              >
                <AnimatedCardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10">
                        <Brain className="h-4.5 w-4.5 text-primary" />
                      </span>
                      <div>
                        <AnimatedCardTitle className="font-display text-lg">
                          <span data-numeric>{stats.dueNow}</span> problem
                          {stats.dueNow > 1 ? 's' : ''} due for recall
                        </AnimatedCardTitle>
                        <AnimatedCardDescription className="text-base">
                          Pattern first, then approach, then code. No peeking early.
                        </AnimatedCardDescription>
                      </div>
                    </div>
                    <Link href="/revision/recall">
                      <Button size="lg" className="group whitespace-nowrap">
                        <Zap className="h-4 w-4" />
                        Start recall session
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                    </Link>
                  </div>
                </AnimatedCardHeader>
              </AnimatedCard>
            )}

            <AnimatedCard delay={0.15}>
              <AnimatedCardHeader>
                <div className="space-y-1">
                  <p className="eyebrow flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-primary" />
                    Interview Readiness
                  </p>
                  <AnimatedCardDescription>Recall quality over the last 30 days</AnimatedCardDescription>
                </div>
              </AnimatedCardHeader>
              <AnimatedCardContent>
                {readiness.totalAttempts === 0 ? (
                  <div className="text-center py-8">
                    <div className="mx-auto w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                      <Brain className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Complete recall sessions to see readiness metrics: recall rate, pattern
                      recognition, and hint independence.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Brain className="h-4 w-4" />
                        <span className="eyebrow">
                          Recall rate
                        </span>
                      </div>
                      <p data-numeric className="font-display text-3xl font-semibold">
                        {readiness.recallRate !== null ? `${readiness.recallRate}%` : 'n/a'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        rated Good or Easy ({readiness.totalAttempts} reviews)
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Target className="h-4 w-4" />
                        <span className="eyebrow">
                          Pattern recognition
                        </span>
                      </div>
                      <p data-numeric className="font-display text-3xl font-semibold">
                        {readiness.patternRate !== null ? `${readiness.patternRate}%` : 'n/a'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        recognized before revealing
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Lightbulb className="h-4 w-4" />
                        <span className="eyebrow">
                          Hint-free
                        </span>
                      </div>
                      <p data-numeric className="font-display text-3xl font-semibold">
                        {readiness.hintFreeRate !== null ? `${readiness.hintFreeRate}%` : 'n/a'}
                      </p>
                      <p className="text-xs text-muted-foreground">recalled without hints</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="eyebrow">
                          Avg recall time
                        </span>
                      </div>
                      <p data-numeric className="font-display text-3xl font-semibold">
                        {readiness.avgMinutes !== null ? `${readiness.avgMinutes}m` : 'n/a'}
                      </p>
                      <p className="text-xs text-muted-foreground">per problem this month</p>
                    </div>
                  </div>
                )}
              </AnimatedCardContent>
            </AnimatedCard>

            <div className="grid gap-6 md:grid-cols-2">
              <AnimatedCard delay={0.2}>
                <AnimatedCardHeader>
                  <div className="space-y-1">
                    <p className="eyebrow flex items-center gap-1.5">
                      <Brain className="h-3.5 w-3.5 text-primary" />
                      Pattern mastery
                    </p>
                    <AnimatedCardDescription>
                      Problems at 30d+ intervals, per pattern
                    </AnimatedCardDescription>
                  </div>
                </AnimatedCardHeader>
                <AnimatedCardContent>
                  {readiness.patterns.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        No patterns classified yet. Set a pattern on each problem&apos;s Recall
                        Note, or organize your repo folders by pattern and re-sync.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {readiness.patterns.slice(0, 6).map((p) => (
                        <ProgressBar
                          key={p.pattern}
                          value={p.mastered}
                          max={p.tracked}
                          label={`${patternLabel(p.pattern)} (${p.mastered}/${p.tracked})`}
                          color="bg-primary"
                          delay={0}
                        />
                      ))}
                    </div>
                  )}
                </AnimatedCardContent>
              </AnimatedCard>

              <div className="space-y-6">
                {weakPatterns.length > 0 && (
                  <AnimatedCard delay={0.2} className="border-destructive/25">
                    <AnimatedCardHeader>
                      <div className="space-y-1">
                        <p className="eyebrow flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                          Weak patterns
                        </p>
                        <AnimatedCardDescription>
                          Where recent recalls struggled
                        </AnimatedCardDescription>
                      </div>
                    </AnimatedCardHeader>
                    <AnimatedCardContent className="space-y-2">
                      {weakPatterns.map((p) => (
                        <div
                          key={p.pattern}
                          className="flex items-center justify-between gap-3 rounded-md border border-destructive/20 bg-destructive/[0.06] px-3 py-2"
                        >
                          <span className="text-sm font-medium">
                            {patternLabel(p.pattern)}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            <span data-numeric>
                              {p.struggles}/{p.attempts}
                            </span>{' '}
                            struggled
                          </span>
                        </div>
                      ))}
                    </AnimatedCardContent>
                  </AnimatedCard>
                )}

                {readiness.recurringConcepts.length > 0 && (
                  <AnimatedCard delay={0.25} className="border-warning/25">
                    <AnimatedCardHeader>
                      <div className="space-y-1">
                        <p className="eyebrow flex items-center gap-1.5">
                          <Lightbulb className="h-3.5 w-3.5 text-warning" />
                          Recurring mistakes
                        </p>
                        <AnimatedCardDescription>
                          Concepts you keep tripping on
                        </AnimatedCardDescription>
                      </div>
                    </AnimatedCardHeader>
                    <AnimatedCardContent className="flex flex-wrap gap-2">
                      {readiness.recurringConcepts.map((c) => (
                        <Badge key={c.concept} variant="warning" className="text-sm">
                          {c.concept} ({c.count})
                        </Badge>
                      ))}
                    </AnimatedCardContent>
                  </AnimatedCard>
                )}

                <AnimatedCard delay={0.3}>
                  <AnimatedCardHeader>
                    <div className="space-y-1">
                      <p className="eyebrow flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-primary" />
                        Problems by difficulty
                      </p>
                      <AnimatedCardDescription>
                        Challenge level breakdown
                      </AnimatedCardDescription>
                    </div>
                  </AnimatedCardHeader>
                  <AnimatedCardContent>
                    {problemsByDifficulty.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No problems yet
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {problemsByDifficulty.map((item) => (
                          <ProgressBar
                            key={item.difficulty ?? 'unknown'}
                            value={item._count}
                            max={stats.totalProblems}
                            label={item.difficulty || 'Unclassified'}
                            color={
                              difficultyBars[item.difficulty?.toLowerCase() ?? ''] ||
                              'bg-secondary'
                            }
                            delay={0}
                          />
                        ))}
                      </div>
                    )}
                  </AnimatedCardContent>
                </AnimatedCard>
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
