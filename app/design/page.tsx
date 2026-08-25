'use client'

import { useState } from 'react'
import { Header } from '@/components/header'
import { AnimatedBackground } from '@/components/ui/animated-background'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Footer } from '@/components/footer'
import { getDifficultyColor } from '@/lib/utils'
import {
  CORE_CONCEPTS,
  SOLID_PRINCIPLES,
  COMMON_PATTERNS,
  EXTERNAL_RESOURCES,
  LLD_PROBLEMS,
} from '@/lib/lld-catalog'
import { CheckCircle, ExternalLink, Loader2, Plus } from 'lucide-react'
import { motion } from 'framer-motion'

export default function DesignPage() {
  const [added, setAdded] = useState<Set<string>>(new Set())
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const addProblem = async (title: string, patterns: string[], difficulty: string) => {
    setPending(title)
    setError(null)
    try {
      const response = await fetch('/api/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          platform: 'lld',
          pattern: patterns.join(', '),
          difficulty,
        }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to add problem')
      }
      setAdded((prev) => new Set(prev).add(title))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add problem')
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <AnimatedBackground />
      <Header />

      <main className="container relative mx-auto max-w-5xl flex-1 space-y-10 px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-2 border-b border-border pb-6"
        >
          <p className="eyebrow">Practice</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Low Level Design
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Start here if you haven&apos;t done LLD before: the concepts below, then work
            through the problems in order. Add any of them to your recall queue the same
            way a solved DSA problem gets tracked.
          </p>
        </motion.div>

        {error && (
          <p className="rounded-md border border-destructive/25 bg-destructive-soft px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Core OOP concepts</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {CORE_CONCEPTS.map((c) => (
              <Card key={c.title}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{c.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{c.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">SOLID principles</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {SOLID_PRINCIPLES.map((p) => (
              <Card key={p.title}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{p.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{p.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Patterns you&apos;ll keep reusing</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {COMMON_PATTERNS.map((p) => (
              <div
                key={p.name}
                className="flex items-start gap-3 rounded-[var(--radius)] border border-border bg-surface p-4"
              >
                <Badge variant="outline" className="shrink-0">{p.category}</Badge>
                <div>
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{p.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Where to go deeper</h2>
          <div className="space-y-2">
            {EXTERNAL_RESOURCES.map((r) => (
              <a
                key={r.href}
                href={r.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-4 rounded-[var(--radius)] border border-border bg-surface p-4 transition-colors hover:bg-surface-raised"
              >
                <div>
                  <p className="text-sm font-semibold">{r.label}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{r.note}</p>
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
              </a>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Practice problems</h2>
          <p className="text-sm text-muted-foreground">
            The standard machine-coding set, roughly easy to hard. Add one to your recall
            queue once you&apos;ve worked through it — it schedules like any other problem.
          </p>
          <div className="space-y-3">
            {LLD_PROBLEMS.map((p) => {
              const isAdded = added.has(p.title)
              const isPending = pending === p.title
              return (
                <div
                  key={p.title}
                  className="flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{p.title}</p>
                      <Badge className={getDifficultyColor(p.difficulty)}>{p.difficulty}</Badge>
                      {p.patterns.map((pattern) => (
                        <Badge key={pattern} variant="outline">{pattern}</Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">{p.summary}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={isAdded ? 'outline' : 'default'}
                    disabled={isAdded || isPending}
                    onClick={() => addProblem(p.title, p.patterns, p.difficulty)}
                    className="shrink-0"
                  >
                    {isAdded ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5" />
                        In queue
                      </>
                    ) : isPending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Adding
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" />
                        Add to queue
                      </>
                    )}
                  </Button>
                </div>
              )
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
