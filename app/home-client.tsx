'use client';

import { motion } from 'framer-motion';
import {
  Brain,
  CheckCircle2,
  Code2,
  GitBranch,
  Github,
  ShieldCheck,
  TimerReset,
} from 'lucide-react';

import { Footer } from '@/components/footer';
import { GithubSignInButton } from '@/components/github-signin-button';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const setupSteps = [
  {
    title: 'Connect GitHub',
    detail: 'Authorize once so RecallDSA can read your solved-problem repo.',
    icon: Github,
  },
  {
    title: 'Import solves',
    detail: 'Pick the repository. Code files become tracked problems.',
    icon: GitBranch,
  },
  {
    title: 'Choose first cards',
    detail: 'Track the problems you want to rehearse, then open the queue.',
    icon: Brain,
  },
];

const clarityPoints = [
  'Recognition and reconstruction are measured separately.',
  'The answer stays hidden until you commit to an approach.',
  'Spaced repetition handles the schedule after every rating.',
];

export function HomeClient({ authError }: { authError?: string | null }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <AnimatedBackground />

      <main className="flex-1">
        <section className="relative border-b border-border">
          <div className="container mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-20">
            <div className="max-w-2xl space-y-7">
              {authError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 rounded-[var(--radius)] border border-destructive/30 bg-destructive-soft px-4 py-3 text-sm text-destructive"
                  role="alert"
                >
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  {authError}
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <Badge variant="outline" className="w-fit">
                  <TimerReset className="h-3.5 w-3.5" />
                  First queue in under 60 seconds
                </Badge>
                <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
                  Turn solved DSA problems into a recall queue.
                </h1>
                <p className="max-w-xl text-base leading-7 text-muted-foreground">
                  RecallDSA reads your GitHub solutions, schedules the next review, and
                  trains the skill interviews actually test: reconstructing the pattern
                  without looking at your code first.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.08 }}
                className="flex flex-col gap-3 sm:flex-row"
              >
                <GithubSignInButton />
              </motion.div>

              <motion.ul
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.14 }}
                className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3"
              >
                {clarityPoints.map((point) => (
                  <li key={point} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{point}</span>
                  </li>
                ))}
              </motion.ul>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="relative"
            >
              <Card className="overflow-hidden">
                <div className="border-b border-border bg-surface-raised px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-md border border-primary/30 bg-primary-soft">
                        <Code2 className="h-3.5 w-3.5 text-primary" />
                      </span>
                      <span className="font-mono text-sm font-semibold">first-run preview</span>
                    </div>
                    <Badge variant="success">3 steps</Badge>
                  </div>
                </div>
                <CardContent className="p-0">
                  <div className="grid divide-y divide-border">
                    {setupSteps.map((step, index) => (
                      <div key={step.title} className="grid gap-4 px-5 py-5 sm:grid-cols-[2rem_1fr_auto] sm:items-center">
                        <span
                          data-numeric
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background font-mono text-xs text-muted-foreground"
                        >
                          {index + 1}
                        </span>
                        <div className="space-y-1">
                          <p className="font-display text-base font-semibold">{step.title}</p>
                          <p className="text-sm text-muted-foreground">{step.detail}</p>
                        </div>
                        <step.icon className="hidden h-4 w-4 text-primary sm:block" />
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border bg-primary-soft px-5 py-4">
                    <p className="text-sm font-medium text-primary">
                      Outcome: imported solves, then a focused queue you control.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        <section className="relative py-14 lg:py-18">
          <div className="container mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="space-y-3">
              <p className="eyebrow">Why it exists</p>
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                Solved once is not remembered.
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Most trackers count completed problems. RecallDSA cares whether you can
                identify the technique and rebuild the solution later.
              </p>
            </div>
            <div className="grid gap-3">
              {[
                ['GitHub is the source of truth', 'No spreadsheet upkeep. Your repository tells the app what you solved.'],
                ['Recall is the daily action', 'The main screen points to the queue first, then supporting metrics.'],
                ['Advanced tools stay out of the way', 'Webhooks, pattern cleanup, and drills are available after the queue exists.'],
              ].map(([title, detail]) => (
                <Card key={title}>
                  <CardContent className="grid gap-2 p-5 sm:grid-cols-[13rem_1fr] sm:items-start">
                    <p className="font-display text-base font-semibold">{title}</p>
                    <p className="text-sm leading-6 text-muted-foreground">{detail}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
