"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { AnimatedBackground } from "@/components/ui/animated-background"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getDifficultyColor, formatRelativeDate } from "@/lib/utils"
import { patternLabel } from "@/lib/constants"
import { MASTERY_INTERVAL_DAYS } from "@/lib/spaced-repetition"
import {
  AlertCircle,
  ArrowRight,
  Brain,
  Calendar,
  CheckCircle,
  Clock,
  History,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react"
import Link from "next/link"
import { Footer } from "@/components/footer"
import { motion } from "framer-motion"

interface Revision {
  id: string
  nextDate: string
  lastRevised: string | null
  intervalDays: number
  repetitions: number
  lapses: number
  problem: {
    id: string
    title: string
    difficulty: string | null
    platform: string | null
    pattern: string | null
  }
}

type Filter = "due" | "upcoming" | "all"

interface BackfillResult {
  scheduled: number
  skipped: number
  duplicatesCollapsed: number
  days: number
  problems: Array<{ id: string; title: string; pattern: string | null; solvedAt: string }>
}

export default function RevisionPage() {
  const [allRevisions, setAllRevisions] = useState<Revision[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>("due")
  const [backfilling, setBackfilling] = useState(false)
  const [backfill, setBackfill] = useState<BackfillResult | null>(null)
  const [backfillError, setBackfillError] = useState<string | null>(null)

  const loadRevisions = () =>
    fetch("/api/revisions")
      .then((r) => r.json())
      .then((data) => setAllRevisions(Array.isArray(data) ? data : []))

  useEffect(() => {
    loadRevisions().finally(() => setLoading(false))
  }, [])

  const runBackfill = async () => {
    setBackfilling(true)
    setBackfill(null)
    setBackfillError(null)
    try {
      const res = await fetch("/api/repos/backfill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 7 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Backfill failed")
      setBackfill(data)
      await loadRevisions()
    } catch (e) {
      setBackfillError(e instanceof Error ? e.message : "Backfill failed")
    } finally {
      setBackfilling(false)
    }
  }

  const now = new Date()
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

  const due = allRevisions.filter((r) => new Date(r.nextDate) < endOfToday)
  const upcoming = allRevisions.filter((r) => new Date(r.nextDate) >= endOfToday)
  const mastered = allRevisions.filter((r) => r.intervalDays >= MASTERY_INTERVAL_DAYS)

  const displayRevisions =
    filter === "due" ? due : filter === "upcoming" ? upcoming : allRevisions

  const stats: Array<{
    key: Filter | "mastered"
    title: string
    value: number
    sub: string
    icon: typeof Target
    tint: string
    iconTint: string
  }> = [
    {
      key: "due",
      title: "Due Now",
      value: due.length,
      sub: "Ready to recall",
      icon: Target,
      tint: "from-red-500/10 to-orange-500/5",
      iconTint: "bg-red-500/10 text-red-600 dark:text-red-400",
    },
    {
      key: "upcoming",
      title: "Upcoming",
      value: upcoming.length,
      sub: "Scheduled ahead",
      icon: TrendingUp,
      tint: "from-blue-500/10 to-cyan-500/5",
      iconTint: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      key: "mastered",
      title: "Mastered",
      value: mastered.length,
      sub: `Interval ${MASTERY_INTERVAL_DAYS}d or longer`,
      icon: Trophy,
      tint: "from-green-500/10 to-emerald-500/5",
      iconTint: "bg-green-500/10 text-green-600 dark:text-green-400",
    },
  ]

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <Header />

      <main className="container relative mx-auto px-4 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border pb-6"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1.5">Revision</h1>
            <p className="text-muted-foreground">
              Reconstruct the pattern, the approach, and the solution before you peek.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={runBackfill}
              disabled={backfilling}
              className="whitespace-nowrap"
            >
              <History className={`mr-2 h-4 w-4 ${backfilling ? "animate-spin" : ""}`} />
              {backfilling ? "Reading commits..." : "Add this week's solves"}
            </Button>
            {due.length > 0 && (
              <Link href="/revision/recall">
                <Button size="lg" className="group whitespace-nowrap">
                  <Brain className="mr-2 h-5 w-5" />
                  Start Recall Session ({due.length})
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            )}
          </div>
        </motion.div>

        {backfillError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {backfillError}
          </div>
        )}

        {backfill && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3"
          >
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold">
                  {backfill.scheduled > 0
                    ? `Added ${backfill.scheduled} problem${backfill.scheduled === 1 ? "" : "s"} from the last ${backfill.days} days`
                    : `Nothing new from the last ${backfill.days} days`}
                </p>
                <p className="text-sm text-muted-foreground">
                  Each one is scheduled from when you solved it, so the oldest comes up first.
                  {backfill.skipped > 0 && ` ${backfill.skipped} already tracked.`}
                  {backfill.duplicatesCollapsed > 0 &&
                    ` ${backfill.duplicatesCollapsed} duplicate file${backfill.duplicatesCollapsed === 1 ? "" : "s"} collapsed.`}
                </p>
              </div>
            </div>
            {backfill.problems.length > 0 && (
              <ul className="space-y-1.5 pl-8">
                {backfill.problems.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium">{p.title}</span>
                    {p.pattern && (
                      <Badge variant="outline" className="text-xs">
                        {patternLabel(p.pattern)}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground font-mono">
                      solved {formatRelativeDate(p.solvedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}

        <div className="grid gap-6 sm:grid-cols-3">
          {stats.map((stat) => {
            const clickable = stat.key !== "mastered"
            return (
              <Card
                key={stat.key}
                className={`group transition-all duration-300 hover:shadow-xl bg-gradient-to-br ${stat.tint} ${
                  clickable ? "cursor-pointer hover:-translate-y-1" : ""
                } ${filter === stat.key ? "ring-2 ring-primary shadow-lg" : ""}`}
                onClick={() => clickable && setFilter(stat.key as Filter)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.iconTint}`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tabular-nums mb-1">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.sub}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {filter === "due" && "Due Now"}
                  {filter === "upcoming" && "Upcoming Reviews"}
                  {filter === "all" && "All Tracked Problems"}
                </CardTitle>
                <CardDescription className="mt-1">
                  {displayRevisions.length}{" "}
                  {displayRevisions.length === 1 ? "problem" : "problems"}
                </CardDescription>
              </div>
              {filter !== "all" && (
                <Button variant="outline" onClick={() => setFilter("all")} className="group">
                  Show All
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 border rounded-xl">
                    <div className="flex items-center gap-4 mb-4">
                      <Skeleton className="h-12 w-12 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-20 rounded-lg" />
                      <Skeleton className="h-6 w-20 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayRevisions.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-semibold mb-2">
                  {filter === "due"
                    ? "Nothing due. Nice work."
                    : filter === "upcoming"
                      ? "No upcoming reviews scheduled"
                      : "No problems tracked yet"}
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  {filter === "all"
                    ? "Track problems from your library to build a review queue"
                    : "Solve something new or browse your library"}
                </p>
                <Link href="/problems">
                  <Button size="lg" className="group">
                    Browse Problems
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {displayRevisions.map((revision) => {
                  const isOverdue = new Date(revision.nextDate) < now
                  const isDue = new Date(revision.nextDate) < endOfToday
                  return (
                    <Card
                      key={revision.id}
                      className={`group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                        isOverdue ? "border-red-500/30 bg-red-500/5" : ""
                      }`}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div
                            className={`p-3 rounded-xl transition-transform group-hover:scale-110 ${
                              isDue
                                ? "bg-gradient-to-br from-red-500/20 to-orange-500/20"
                                : "bg-primary/15"
                            }`}
                          >
                            <Calendar
                              className={`h-6 w-6 ${isDue ? "text-red-600 dark:text-red-400" : "text-primary"}`}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                              {revision.problem.title}
                            </h3>

                            <div className="flex flex-wrap gap-2 mb-3">
                              {revision.problem.pattern && (
                                <Badge variant="default">
                                  {patternLabel(revision.problem.pattern)}
                                </Badge>
                              )}
                              {revision.problem.difficulty && (
                                <Badge className={getDifficultyColor(revision.problem.difficulty)}>
                                  {revision.problem.difficulty}
                                </Badge>
                              )}
                              {isOverdue && (
                                <Badge variant="destructive">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Overdue
                                </Badge>
                              )}
                              {revision.lapses > 0 && (
                                <Badge variant="warning">
                                  {revision.lapses} lapse{revision.lapses === 1 ? "" : "s"}
                                </Badge>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Next: </span>
                                <span
                                  className={`font-semibold ${isOverdue ? "text-red-600 dark:text-red-400" : "text-foreground"}`}
                                >
                                  {formatRelativeDate(revision.nextDate)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Interval: </span>
                                <span className="font-semibold text-foreground">
                                  {revision.intervalDays}d
                                </span>
                              </div>
                              {revision.lastRevised && (
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">Last: </span>
                                  <span className="font-semibold text-foreground">
                                    {formatRelativeDate(revision.lastRevised)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <Link href={`/problems/${revision.problem.id}`}>
                            <Button variant="outline" className="group/btn whitespace-nowrap">
                              Open
                              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
