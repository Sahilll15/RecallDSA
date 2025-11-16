"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { AnimatedBackground } from "@/components/ui/animated-background"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getDifficultyColor, formatRelativeDate } from "@/lib/utils"
import { Calendar, AlertCircle, CheckCircle, Clock, Target, TrendingUp, Sparkles, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Footer } from "@/components/footer"
import { motion } from "framer-motion"

interface Revision {
  id: string
  nextDate: string
  lastRevised: string | null
  problem: {
    id: string
    title: string
    difficulty: string | null
    platform: string | null
  }
}

export default function RevisionPage() {
  const [allRevisions, setAllRevisions] = useState<Revision[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "today" | "week" | "overdue">("all")

  useEffect(() => {
    fetchRevisions()
  }, [])

  const fetchRevisions = async () => {
    setLoading(true)
    const response = await fetch("/api/revisions")
    const data = await response.json()
    setAllRevisions(data)
    setLoading(false)
  }

  const filterRevisions = (revisions: Revision[], filterType: string) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekFromNow = new Date(today)
    weekFromNow.setDate(weekFromNow.getDate() + 7)

    switch (filterType) {
      case "today":
        return revisions.filter((r) => new Date(r.nextDate) <= new Date(today.getTime() + 24 * 60 * 60 * 1000))
      case "week":
        return revisions.filter(
          (r) => new Date(r.nextDate) >= today && new Date(r.nextDate) <= weekFromNow
        )
      case "overdue":
        return revisions.filter((r) => new Date(r.nextDate) < today)
      default:
        return revisions
    }
  }

  const dueToday = filterRevisions(allRevisions, "today")
  const dueThisWeek = filterRevisions(allRevisions, "week")
  const overdue = filterRevisions(allRevisions, "overdue")

  const displayRevisions = filter === "all" ? allRevisions : filterRevisions(allRevisions, filter)

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <Header />
      
      <main className="container relative mx-auto px-4 py-8 space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-purple-500/10 to-blue-500/10 p-8 md:p-12 border border-primary/10"
        >
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="relative">
            <Badge className="mb-4">
              <Calendar className="h-3 w-3 mr-2" />
              Revision Tracker
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Revision
              </span>{' '}
              Schedule
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Stay on top of your spaced repetition schedule
            </p>
          </div>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card
            className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
              filter === "today" ? "ring-2 ring-primary shadow-lg" : ""
            } bg-gradient-to-br from-green-500/10 to-emerald-500/5`}
            onClick={() => setFilter("today")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold">Due Today</CardTitle>
              <div className={`p-2 rounded-lg transition-colors ${filter === "today" ? "bg-green-500/20" : "bg-green-500/10 group-hover:bg-green-500/20"}`}>
                <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{dueToday.length}</div>
              <p className="text-xs text-muted-foreground">Ready to revise</p>
            </CardContent>
          </Card>

          <Card
            className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
              filter === "week" ? "ring-2 ring-primary shadow-lg" : ""
            } bg-gradient-to-br from-blue-500/10 to-cyan-500/5`}
            onClick={() => setFilter("week")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold">Due This Week</CardTitle>
              <div className={`p-2 rounded-lg transition-colors ${filter === "week" ? "bg-blue-500/20" : "bg-blue-500/10 group-hover:bg-blue-500/20"}`}>
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{dueThisWeek.length}</div>
              <p className="text-xs text-muted-foreground">Upcoming soon</p>
            </CardContent>
          </Card>

          <Card
            className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
              filter === "overdue" ? "ring-2 ring-destructive shadow-lg" : ""
            } bg-gradient-to-br from-red-500/10 to-orange-500/5`}
            onClick={() => setFilter("overdue")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold">Overdue</CardTitle>
              <div className={`p-2 rounded-lg transition-colors ${filter === "overdue" ? "bg-red-500/20" : "bg-red-500/10 group-hover:bg-red-500/20"}`}>
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">{overdue.length}</div>
              <p className="text-xs text-muted-foreground">Needs attention</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {filter === "all" && "All Revisions"}
                  {filter === "today" && "Due Today"}
                  {filter === "week" && "Due This Week"}
                  {filter === "overdue" && "Overdue Problems"}
                </CardTitle>
                <CardDescription className="mt-1">
                  {displayRevisions.length} {displayRevisions.length === 1 ? "problem" : "problems"} {filter !== "all" ? "in this filter" : "total"}
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
                  {filter === "all"
                    ? "No problems in revision yet"
                    : `No problems ${filter === "today" ? "due today" : filter === "week" ? "due this week" : "overdue"}`}
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Add problems to your revision schedule to get started
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
                {displayRevisions.map((revision, index) => {
                  const isOverdue = new Date(revision.nextDate) < new Date()
                  return (
                    <Card
                      key={revision.id}
                      className={`group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                        isOverdue ? "border-red-500/30 bg-red-500/5" : ""
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl transition-transform group-hover:scale-110 ${
                            isOverdue 
                              ? "bg-gradient-to-br from-red-500/20 to-orange-500/20" 
                              : "bg-gradient-to-br from-primary/20 to-purple-600/20"
                          }`}>
                            <Calendar className={`h-6 w-6 ${isOverdue ? "text-red-600 dark:text-red-400" : "text-primary"}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold mb-3 group-hover:text-primary transition-colors">
                              {revision.problem.title}
                            </h3>
                            
                            <div className="flex flex-wrap gap-2 mb-4">
                              {revision.problem.difficulty && (
                                <Badge className={getDifficultyColor(revision.problem.difficulty)}>
                                  {revision.problem.difficulty}
                                </Badge>
                              )}
                              {revision.problem.platform && (
                                <Badge variant="outline">{revision.problem.platform}</Badge>
                              )}
                              {isOverdue && (
                                <Badge variant="destructive">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Overdue
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Next: </span>
                                <span className={`font-semibold ${isOverdue ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
                                  {formatRelativeDate(revision.nextDate)}
                                </span>
                              </div>
                              {revision.lastRevised && (
                                <div className="flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">Last: </span>
                                  <span className="font-semibold text-foreground">
                                    {formatRelativeDate(revision.lastRevised)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <Link href={`/problems/${revision.problem.id}`}>
                            <Button className="group/btn whitespace-nowrap">
                              Review Now
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

