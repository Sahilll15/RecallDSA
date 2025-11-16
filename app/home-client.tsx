'use client';

import { GithubSignInButton } from '@/components/github-signin-button';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatedCard, AnimatedCardContent, AnimatedCardDescription, AnimatedCardHeader, AnimatedCardTitle } from '@/components/ui/animated-card';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { GradientText } from '@/components/ui/gradient-text';
import {
  ArrowRight,
  BarChart3,
  CalendarCheck2,
  Code2,
  Sparkles,
  Timer,
  Users,
  Workflow,
  Zap,
  ShieldCheck,
  Github,
  TrendingUp,
  Target,
  Rocket,
} from 'lucide-react';
import { Footer } from '@/components/footer';
import { motion } from 'framer-motion';

const heroStats = [
  { value: '4.2K+', label: 'Problems indexed', icon: Code2 },
  { value: '92%', label: 'Revision adherence', icon: CalendarCheck2 },
  { value: '7 days', label: 'Adaptive baseline', icon: Timer },
];

const featureHighlights = [
  {
    icon: Sparkles,
    title: 'Adaptive spaced repetition',
    description:
      'Intervals expand intelligently with every successful revision so you only practice when it matters.',
  },
  {
    icon: ShieldCheck,
    title: 'Webhook native syncing',
    description:
      'Every push to your DSA repo syncs instantly via secure GitHub webhooks with signature verification.',
  },
  {
    icon: BarChart3,
    title: 'Operational analytics',
    description:
      'Drill into platform mix, language coverage, velocity, and streaks directly inside the dashboard.',
  },
  {
    icon: Workflow,
    title: 'Zero-maintenance ingestion',
    description:
      'Generic parsing handles any folder strategy, surfaces metadata, and deduplicates files automatically.',
  },
  {
    icon: Users,
    title: 'Multi-tenant by design',
    description:
      'Every GitHub account gets a private workspace with encrypted tokens and isolated data boundaries.',
  },
  {
    icon: Zap,
    title: 'Lightning fast UX',
    description:
      'Server components, streaming routes, and optimistic mutations keep every interaction under 100ms.',
  },
];

const workflowSteps = [
  {
    title: 'Connect your repo',
    detail:
      'Authorize GitHub once and pick any DSA repository, no restructuring required.',
    metric: '2 min setup',
    icon: Github,
  },
  {
    title: 'Auto-ingest problems',
    detail:
      'Tree + contents APIs populate every code file with difficulty, platform, and language context.',
    metric: 'All languages',
    icon: TrendingUp,
  },
  {
    title: 'Schedule & revise',
    detail:
      'Add any solution to your queue, receive reminders, and double the interval with one tap.',
    metric: 'Never forget',
    icon: Target,
  },
];

export function HomeClient() {
  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      
      <section className="relative">
        <div className="container relative mx-auto max-w-7xl px-4 py-16 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Badge variant="outline" className="border-primary/20">
                  <Rocket className="h-3 w-3 mr-1.5" />
                  Built for problem solvers
                </Badge>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl"
              >
                Master DSA with{' '}
                <GradientText className="text-4xl sm:text-5xl lg:text-6xl">
                  intelligent revision
                </GradientText>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-base text-muted-foreground max-w-xl"
              >
                Connect your GitHub repository and let spaced repetition keep
                you interview-ready. No spreadsheets, no manual tracking.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-wrap gap-3 pt-2"
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <GithubSignInButton />
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" className="group">
                    Learn more
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="grid gap-3 sm:grid-cols-3 pt-6"
              >
                {heroStats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    className="flex flex-col gap-1 p-4 rounded-lg bg-card/50 border border-border/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300"
                  >
                    <div className="flex items-center gap-2">
                      <stat.icon className="h-4 w-4 text-primary" />
                      <p className="text-2xl font-semibold">{stat.value}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stat.label}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative"
            >
              <AnimatedCard className="relative" delay={0.4}>
                <AnimatedCardHeader>
                  <AnimatedCardTitle>Live Activity</AnimatedCardTitle>
                  <AnimatedCardDescription>
                    Real-time sync from your repository
                  </AnimatedCardDescription>
                </AnimatedCardHeader>
                <AnimatedCardContent className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="rounded-md border border-border/50 bg-muted/30 p-3 font-mono text-xs"
                  >
                    <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-500 mb-2">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                      </span>
                      Webhook • 2s ago
                    </div>
                    <pre className="text-xs leading-relaxed text-muted-foreground">
                      {`leetcode/medium/construct-binary-tree.py
Platform: LeetCode | Difficulty: Medium
Revision interval: 14 days`}
                    </pre>
                  </motion.div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 }}
                      whileHover={{ scale: 1.05 }}
                      className="rounded-md border border-border/50 bg-card p-3 transition-all"
                    >
                      <p className="text-xs text-muted-foreground">Due today</p>
                      <p className="mt-1 text-2xl font-semibold">6</p>
                      <Badge variant="success" className="mt-2">
                        Ready to review
                      </Badge>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 }}
                      whileHover={{ scale: 1.05 }}
                      className="rounded-md border border-border/50 bg-card p-3 transition-all"
                    >
                      <p className="text-xs text-muted-foreground">
                        Problems synced
                      </p>
                      <p className="mt-1 text-2xl font-semibold">128</p>
                      <Badge className="mt-2">4 platforms</Badge>
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="rounded-md border border-border/50 bg-card p-3"
                  >
                    <p className="text-xs text-muted-foreground mb-2">
                      Languages tracked
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {['cpp', 'python', 'java', 'typescript', 'go', 'rust'].map((lang, index) => (
                        <motion.div
                          key={lang}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1 + index * 0.05 }}
                        >
                          <Badge variant="outline" className="text-xs">
                            {lang}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatedCardContent>
              </AnimatedCard>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-muted/30 relative">
        <div className="container mx-auto max-w-7xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto text-center mb-12"
          >
            <Badge variant="outline" className="mb-3">
              Features
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight mb-4">
              Built for modern workflows
            </h2>
            <p className="text-sm text-muted-foreground">
              Intelligent automation and seamless GitHub integration to keep you
              focused on what matters
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featureHighlights.map((feature, index) => (
              <AnimatedCard key={feature.title} delay={index * 0.1} hover={true}>
                <AnimatedCardHeader>
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-3"
                  >
                    <feature.icon className="h-5 w-5 text-primary" />
                  </motion.div>
                  <AnimatedCardTitle className="text-base">{feature.title}</AnimatedCardTitle>
                </AnimatedCardHeader>
                <AnimatedCardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </AnimatedCardContent>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 relative">
        <div className="container mx-auto max-w-7xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto text-center mb-12"
          >
            <Badge variant="outline" className="mb-3">
              How it works
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight mb-4">
              Get started in minutes
            </h2>
            <p className="text-sm text-muted-foreground">
              Simple setup with powerful automation that scales with your
              learning journey
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {workflowSteps.map((step, index) => (
              <div key={step.title} className="relative">
                <AnimatedCard delay={index * 0.15} className="h-full">
                  <AnimatedCardHeader>
                    <div className="flex items-center gap-3 mb-3">
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: 15 }}
                        transition={{ type: "spring", stiffness: 400 }}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"
                      >
                        <step.icon className="h-5 w-5 text-primary" />
                      </motion.div>
                      <Badge variant="secondary" className="text-xs">
                        {step.metric}
                      </Badge>
                    </div>
                    <AnimatedCardTitle className="text-base">{step.title}</AnimatedCardTitle>
                  </AnimatedCardHeader>
                  <AnimatedCardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.detail}
                    </p>
                  </AnimatedCardContent>
                </AnimatedCard>
                {index < workflowSteps.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.15 }}
                    className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2"
                  >
                    <ArrowRight className="h-5 w-5 text-primary/50" />
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 relative">
        <div className="container mx-auto max-w-4xl px-4">
          <AnimatedCard delay={0.2} className="border-primary/30 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent">
            <AnimatedCardContent className="p-8 md:p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 200 }}
                className="inline-block mb-4"
              >
                <Sparkles className="h-12 w-12 text-primary" />
              </motion.div>
              <h2 className="text-2xl font-semibold tracking-tight mb-3">
                Ready to master DSA?
              </h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-lg mx-auto">
                Join developers using intelligent spaced repetition to stay
                interview-ready
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <GithubSignInButton />
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline">Learn more</Button>
                </motion.div>
              </div>
            </AnimatedCardContent>
          </AnimatedCard>
        </div>
      </section>

      <Footer />
    </div>
  );
}

