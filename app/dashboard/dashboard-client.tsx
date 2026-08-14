'use client';

import { Header } from '@/components/header';
import {
  AnimatedCard,
  AnimatedCardContent,
  AnimatedCardDescription,
  AnimatedCardHeader,
  AnimatedCardTitle,
} from '@/components/ui/animated-card';
import { StatCard } from '@/components/ui/stat-card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { GradientText } from '@/components/ui/gradient-text';
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
}

const difficultyBars: Record<string, string> = {
  easy: 'bg-green-500',
  medium: 'bg-yellow-500',
  hard: 'bg-red-500',
};

export function DashboardClient({
  user,
  stats,
  readiness,
  problemsByDifficulty,
}: DashboardClientProps) {
  const weakPatterns = readiness.patterns
    .filter((p) => p.attempts >= 2 && p.struggles / p.attempts >= 0.5)
    .slice(0, 3);

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <Header user={user} />

      <main className="container mx-auto max-w-7xl px-4 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-3"
        >
          <GradientText as="h1" className="text-3xl md:text-4xl">
            Welcome back, {user.name}
          </GradientText>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-base text-muted-foreground"
          >
            Not how many you solved. How many you can reconstruct.
          </motion.p>
        </motion.div>

        {stats.repos === 0 ? (
          <AnimatedCard className="border-dashed" delay={0.3}>
            <AnimatedCardHeader className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 shadow-glow-sm"
              >
                <Code2 className="h-8 w-8 text-primary" />
              </motion.div>
              <AnimatedCardTitle className="text-2xl">No Repository Connected</AnimatedCardTitle>
              <AnimatedCardDescription className="text-base">
                Get started by connecting your DSA GitHub repository
              </AnimatedCardDescription>
            </AnimatedCardHeader>
            <AnimatedCardContent className="flex justify-center pb-6">
              <Link href="/settings">
                <Button size="lg" className="group shadow-large">
                  <Zap className="mr-2 h-4 w-4" />
                  Connect Repository
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </AnimatedCardContent>
          </AnimatedCard>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Due Now"
                value={stats.dueNow}
                description={stats.dueNow > 0 ? 'Waiting for recall' : 'Queue is clear'}
                icon={Calendar}
                iconColor="text-destructive"
                iconBgColor="bg-destructive/10"
                valueColor={stats.dueNow > 0 ? 'text-destructive' : undefined}
                delay={0.1}
              />

              <StatCard
                title="Mastered"
                value={stats.mastered}
                description="At 30d+ intervals"
                icon={Trophy}
                iconColor="text-success"
                iconBgColor="bg-success/10"
                delay={0.2}
              />

              <StatCard
                title="In Revision"
                value={stats.totalRevisions}
                description={`of ${stats.totalProblems} problems`}
                icon={Activity}
                iconColor="text-foreground"
                iconBgColor="bg-secondary"
                delay={0.3}
              />

              <StatCard
                title="Total Problems"
                value={stats.totalProblems}
                description={`${stats.repos} ${stats.repos === 1 ? 'repository' : 'repositories'}`}
                icon={Code2}
                iconColor="text-primary"
                iconBgColor="bg-primary/10"
                delay={0.4}
              />
            </div>

            {stats.dueNow > 0 && (
              <AnimatedCard
                delay={0.5}
                className="border-primary/30 bg-primary/5"
              >
                <AnimatedCardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/20">
                        <Brain className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <AnimatedCardTitle className="text-xl">
                          {stats.dueNow} problem{stats.dueNow > 1 ? 's' : ''} due for recall
                        </AnimatedCardTitle>
                        <AnimatedCardDescription className="text-base">
                          Pattern first, then approach, then code. No peeking early.
                        </AnimatedCardDescription>
                      </div>
                    </div>
                    <Link href="/revision/recall">
                      <Button size="lg" className="group shadow-large whitespace-nowrap">
                        <Zap className="mr-2 h-4 w-4" />
                        Start Recall Session
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </div>
                </AnimatedCardHeader>
              </AnimatedCard>
            )}

            <AnimatedCard delay={0.6}>
              <AnimatedCardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <AnimatedCardTitle>Interview Readiness</AnimatedCardTitle>
                    <AnimatedCardDescription>
                      Recall quality over the last 30 days
                    </AnimatedCardDescription>
                  </div>
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
                        <span className="text-xs font-mono font-semibold uppercase tracking-wider">
                          Recall rate
                        </span>
                      </div>
                      <p className="text-3xl font-bold tabular-nums">
                        {readiness.recallRate !== null ? `${readiness.recallRate}%` : 'n/a'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        rated Good or Easy ({readiness.totalAttempts} reviews)
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Target className="h-4 w-4" />
                        <span className="text-xs font-mono font-semibold uppercase tracking-wider">
                          Pattern recognition
                        </span>
                      </div>
                      <p className="text-3xl font-bold tabular-nums">
                        {readiness.patternRate !== null ? `${readiness.patternRate}%` : 'n/a'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        recognized before revealing
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Lightbulb className="h-4 w-4" />
                        <span className="text-xs font-mono font-semibold uppercase tracking-wider">
                          Hint-free
                        </span>
                      </div>
                      <p className="text-3xl font-bold tabular-nums">
                        {readiness.hintFreeRate !== null ? `${readiness.hintFreeRate}%` : 'n/a'}
                      </p>
                      <p className="text-xs text-muted-foreground">recalled without hints</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs font-mono font-semibold uppercase tracking-wider">
                          Avg recall time
                        </span>
                      </div>
                      <p className="text-3xl font-bold tabular-nums">
                        {readiness.avgMinutes !== null ? `${readiness.avgMinutes}m` : 'n/a'}
                      </p>
                      <p className="text-xs text-muted-foreground">per problem this month</p>
                    </div>
                  </div>
                )}
              </AnimatedCardContent>
            </AnimatedCard>

            <div className="grid gap-6 md:grid-cols-2">
              <AnimatedCard delay={0.7}>
                <AnimatedCardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Brain className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <AnimatedCardTitle>Pattern Mastery</AnimatedCardTitle>
                      <AnimatedCardDescription>
                        Problems at 30d+ intervals, per pattern
                      </AnimatedCardDescription>
                    </div>
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
                  <AnimatedCard delay={0.75} className="border-red-500/20">
                    <AnimatedCardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-500/10">
                          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <AnimatedCardTitle>Weak Patterns</AnimatedCardTitle>
                          <AnimatedCardDescription>
                            Where recent recalls struggled
                          </AnimatedCardDescription>
                        </div>
                      </div>
                    </AnimatedCardHeader>
                    <AnimatedCardContent className="space-y-2">
                      {weakPatterns.map((p) => (
                        <div
                          key={p.pattern}
                          className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2"
                        >
                          <span className="text-sm font-semibold">
                            {patternLabel(p.pattern)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            struggled in {p.struggles} of {p.attempts} recalls
                          </span>
                        </div>
                      ))}
                    </AnimatedCardContent>
                  </AnimatedCard>
                )}

                {readiness.recurringConcepts.length > 0 && (
                  <AnimatedCard delay={0.8} className="border-yellow-500/20">
                    <AnimatedCardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-yellow-500/10">
                          <Lightbulb className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                          <AnimatedCardTitle>Recurring Mistakes</AnimatedCardTitle>
                          <AnimatedCardDescription>
                            Concepts you keep tripping on
                          </AnimatedCardDescription>
                        </div>
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

                <AnimatedCard delay={0.85}>
                  <AnimatedCardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <TrendingUp className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <AnimatedCardTitle>Problems by Difficulty</AnimatedCardTitle>
                        <AnimatedCardDescription>
                          Challenge level breakdown
                        </AnimatedCardDescription>
                      </div>
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
