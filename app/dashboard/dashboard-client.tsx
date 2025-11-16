'use client';

import { Header } from '@/components/header';
import { AnimatedCard, AnimatedCardContent, AnimatedCardDescription, AnimatedCardHeader, AnimatedCardTitle } from '@/components/ui/animated-card';
import { StatCard } from '@/components/ui/stat-card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { GradientText } from '@/components/ui/gradient-text';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Code2,
  Calendar,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Target,
  Activity,
  Sparkles,
  Zap,
  Flame,
} from 'lucide-react';
import { Footer } from '@/components/footer';

interface DashboardClientProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
  stats: {
    totalProblems: number;
    totalRevisions: number;
    dueToday: number;
    dueThisWeek: number;
    overdue: number;
    repos: number;
  };
  problemsByPlatform: Array<{
    platform: string | null;
    _count: number;
  }>;
  problemsByDifficulty: Array<{
    difficulty: string | null;
    _count: number;
  }>;
}

export function DashboardClient({
  user,
  stats,
  problemsByPlatform,
  problemsByDifficulty,
}: DashboardClientProps) {
  const difficultyColors = {
    easy: { badge: 'success', bg: 'bg-success/10', text: 'text-success', bar: 'bg-success' },
    medium: { badge: 'warning', bg: 'bg-warning/10', text: 'text-warning', bar: 'bg-warning' },
    hard: { badge: 'destructive', bg: 'bg-destructive/10', text: 'text-destructive', bar: 'bg-destructive' },
  };

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
          <div className="flex items-center gap-2">
            <GradientText as="h1" className="text-3xl md:text-4xl">
              Welcome back, {user.name}
            </GradientText>
            <motion.div
              animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
              transition={{
                duration: 2.5,
                ease: "easeInOut",
                repeat: Infinity,
                repeatDelay: 3
              }}
            >
              <Sparkles className="h-6 w-6 text-primary" />
            </motion.div>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-base text-muted-foreground"
          >
            Track your progress and stay on top of your revision schedule
          </motion.p>
        </motion.div>

        {stats.repos === 0 ? (
          <AnimatedCard className="border-dashed" delay={0.3}>
            <AnimatedCardHeader className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-4 shadow-glow-sm"
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
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" className="group shadow-large">
                    <Zap className="mr-2 h-4 w-4" />
                    Connect Repository
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </motion.div>
              </Link>
            </AnimatedCardContent>
          </AnimatedCard>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Problems"
                value={stats.totalProblems}
                description={`${stats.repos} ${stats.repos === 1 ? 'repository' : 'repositories'}`}
                icon={Code2}
                iconColor="text-primary"
                iconBgColor="bg-primary/10"
                delay={0.1}
              />

              <StatCard
                title="In Revision"
                value={stats.totalRevisions}
                description="Problems tracked"
                icon={Activity}
                iconColor="text-purple-600 dark:text-purple-400"
                iconBgColor="bg-purple-500/10"
                delay={0.2}
              />

              <StatCard
                title="Due Today"
                value={stats.dueToday}
                description={`${stats.dueThisWeek} this week`}
                icon={Calendar}
                iconColor="text-success"
                iconBgColor="bg-success/10"
                delay={0.3}
              />

              <StatCard
                title="Overdue"
                value={stats.overdue}
                description="Needs attention"
                icon={AlertCircle}
                iconColor="text-destructive"
                iconBgColor="bg-destructive/10"
                valueColor="text-destructive"
                delay={0.4}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <AnimatedCard delay={0.5}>
                <AnimatedCardHeader>
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="p-2 rounded-lg bg-primary/10"
                      whileHover={{ rotate: 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Target className="h-5 w-5 text-primary" />
                    </motion.div>
                    <div>
                      <AnimatedCardTitle>Problems by Platform</AnimatedCardTitle>
                      <AnimatedCardDescription>
                        Distribution across coding platforms
                      </AnimatedCardDescription>
                    </div>
                  </div>
                </AnimatedCardHeader>
                <AnimatedCardContent>
                  {problemsByPlatform.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <div className="mx-auto w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                        <Target className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No problems yet</p>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      {problemsByPlatform.map((item, index) => (
                        <motion.div
                          key={item.platform}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + index * 0.1 }}
                        >
                          <ProgressBar
                            value={item._count}
                            max={stats.totalProblems}
                            label={item.platform || 'Other'}
                            color="bg-gradient-to-r from-primary to-purple-500"
                            delay={0}
                          />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatedCardContent>
              </AnimatedCard>

              <AnimatedCard delay={0.6}>
                <AnimatedCardHeader>
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="p-2 rounded-lg bg-primary/10"
                      whileHover={{ scale: 1.2 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </motion.div>
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
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <div className="mx-auto w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                        <TrendingUp className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No problems yet</p>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      {problemsByDifficulty.map((item, index) => {
                        const difficulty = item.difficulty?.toLowerCase() as keyof typeof difficultyColors;
                        const colors = difficultyColors[difficulty] || { bar: 'bg-secondary' };
                        
                        return (
                          <motion.div
                            key={item.difficulty}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 + index * 0.1 }}
                          >
                            <ProgressBar
                              value={item._count}
                              max={stats.totalProblems}
                              label={item.difficulty || 'Unknown'}
                              color={colors.bar}
                              delay={0}
                            />
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </AnimatedCardContent>
              </AnimatedCard>
            </div>

            {(stats.dueToday > 0 || stats.overdue > 0) && (
              <AnimatedCard 
                delay={0.8}
                className="border-primary/30 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent"
              >
                <AnimatedCardHeader>
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="p-2 rounded-lg bg-primary/20"
                    >
                      <Flame className="h-6 w-6 text-primary" />
                    </motion.div>
                    <div>
                      <AnimatedCardTitle className="text-xl">Ready to Revise?</AnimatedCardTitle>
                      <AnimatedCardDescription className="text-base">
                        You have {stats.dueToday + stats.overdue} problem
                        {stats.dueToday + stats.overdue > 1 ? 's' : ''} waiting for revision
                      </AnimatedCardDescription>
                    </div>
                  </div>
                </AnimatedCardHeader>
                <AnimatedCardContent>
                  <Link href="/revision">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="lg" className="group shadow-large">
                        <Zap className="mr-2 h-4 w-4" />
                        Start Revising
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </motion.div>
                  </Link>
                </AnimatedCardContent>
              </AnimatedCard>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

