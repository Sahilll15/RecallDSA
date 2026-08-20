'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Header } from '@/components/header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CodeViewer } from '@/components/code-viewer'
import { RatingButtons } from '@/components/rating-buttons'
import { ProblemStatement } from '@/components/problem-statement'
import { RecallNoteEditor, type RecallNoteData } from '@/components/recall-note-editor'
import { MistakeLog, type MistakeData } from '@/components/mistake-log'
import { AttemptHistory, type AttemptData } from '@/components/attempt-history'
import { getDifficultyColor, getPlatformColor, formatRelativeDate, formatProblemTitle } from '@/lib/utils'
import { patternLabel } from '@/lib/constants'
import type { RecallRating } from '@/lib/spaced-repetition'
import { Calendar, Plus, Trash2, Code2, Clock, TrendingUp, Sparkles, FileCode, Brain, AlertTriangle, History, Eye, EyeOff } from 'lucide-react'
import { Footer } from '@/components/footer'

interface ProblemData {
  id: string
  title: string
  platform: string | null
  difficulty: string | null
  pattern: string | null
  language: string | null
  path: string
  content: string
  updatedAt: string
  revisions: Array<{
    id: string
    nextDate: string
    lastRevised: string | null
    intervalDays: number
    easeFactor: number
    repetitions: number
    lapses: number
  }>
  recallNote: RecallNoteData | null
  mistakes: MistakeData[]
  attempts: AttemptData[]
}

export default function ProblemDetailPage() {
  const params = useParams()
  const problemId = Array.isArray(params.id) ? params.id[0] : params.id
  const [problem, setProblem] = useState<ProblemData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  // The solution stays hidden until asked for: seeing it for free
  // turns a recall exercise into reading.
  const [solutionShown, setSolutionShown] = useState(false)

  const fetchProblem = useCallback(async () => {
    if (!problemId) return
    setLoading(true)
    const response = await fetch(`/api/problems/${problemId}`)
    const data = await response.json()
    setProblem(data)
    setLoading(false)
  }, [problemId])

  useEffect(() => {
    fetchProblem()
  }, [fetchProblem])

  const addToRevision = async () => {
    setActionLoading(true)
    if (!problemId) return
    await fetch('/api/revisions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problemId }),
    })
    await fetchProblem()
    setActionLoading(false)
  }

  const rateRecall = async (rating: RecallRating) => {
    if (!problem?.revisions[0]?.id) return
    setActionLoading(true)
    await fetch(`/api/revisions/${problem.revisions[0].id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating }),
    })
    await fetchProblem()
    setActionLoading(false)
  }

  const removeFromRevision = async () => {
    if (!problem?.revisions[0]?.id) return
    setActionLoading(true)
    await fetch(`/api/revisions/${problem.revisions[0].id}`, {
      method: 'DELETE',
    })
    await fetchProblem()
    setActionLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-12 w-3/4 rounded-xl" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </div>
          <Skeleton className="h-[600px] w-full rounded-xl" />
        </main>
      </div>
    )
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <Card className="border-dashed border-2">
            <CardContent className="p-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Code2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold mb-2">Problem not found</p>
              <p className="text-sm text-muted-foreground">
                The problem you&apos;re looking for doesn&apos;t exist or has been removed
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const revision = problem.revisions[0]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        <div className="space-y-6">
          <div>
            <p className="eyebrow mb-2 flex items-center gap-1.5">
              <FileCode className="h-3.5 w-3.5 text-primary" />
              Problem
            </p>
            <h1 className="mb-4 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              {formatProblemTitle(problem.title)}
            </h1>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {problem.platform && (
                <Badge className={getPlatformColor(problem.platform)}>
                  {problem.platform}
                </Badge>
              )}
              {problem.difficulty && (
                <Badge className={getDifficultyColor(problem.difficulty)}>
                  {problem.difficulty}
                </Badge>
              )}
              {problem.pattern && (
                <Badge>
                  <Brain className="h-3 w-3 mr-1" />
                  {patternLabel(problem.pattern)}
                </Badge>
              )}
              {problem.language && (
                <Badge variant="outline">
                  <Code2 className="h-3 w-3 mr-1" />
                  {problem.language}
                </Badge>
              )}
              {revision && (
                <Badge variant="success">
                  <Sparkles className="h-3 w-3 mr-1" />
                  In Revision
                </Badge>
              )}
            </div>

            <p className="mb-6 inline-block rounded-md border border-border bg-surface px-3 py-1.5 font-mono text-xs text-muted-foreground">
              {problem.path}
            </p>

            <div className="flex flex-wrap gap-3">
              {!revision ? (
                <Button
                  onClick={addToRevision}
                  disabled={actionLoading}
                  size="lg"
                  className="group"
                >
                  <Plus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  Add to Revision Schedule
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={removeFromRevision}
                  disabled={actionLoading}
                  size="lg"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove from Revision
                </Button>
              )}
            </div>
          </div>

          {revision && (
            <Alert className="border-primary/20 bg-primary/5">
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                <div className="grid sm:grid-cols-3 gap-6 mt-2">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Next Revision
                      </p>
                    </div>
                    <p className="text-lg font-bold">{formatRelativeDate(revision.nextDate)}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Last Revised
                      </p>
                    </div>
                    <p className="text-lg font-bold">
                      {revision.lastRevised
                        ? formatRelativeDate(revision.lastRevised)
                        : "Not yet"}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Current Interval
                      </p>
                    </div>
                    <p className="text-lg font-bold">{revision.intervalDays} days</p>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <p className="text-sm font-semibold">Just revised it? Rate your recall:</p>
                  <RatingButtons
                    state={{
                      intervalDays: revision.intervalDays,
                      easeFactor: revision.easeFactor,
                      repetitions: revision.repetitions,
                      lapses: revision.lapses,
                    }}
                    onRate={rateRecall}
                    disabled={actionLoading}
                    className="max-w-md"
                  />
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Card>
          <CardContent className="p-5">
            <ProblemStatement problemId={problem.id} />
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
            <div className="space-y-1">
              <p className="eyebrow flex items-center gap-1.5">
                <Code2 className="h-3.5 w-3.5 text-primary" />
                Your solution
              </p>
              <CardDescription>
                {solutionShown
                  ? 'Compare it against what you just reconstructed.'
                  : 'Reconstruct it from the question first, then compare.'}
              </CardDescription>
            </div>
            <Button
              variant={solutionShown ? 'ghost' : 'outline'}
              size="sm"
              onClick={() => setSolutionShown((v) => !v)}
              aria-expanded={solutionShown}
              className="shrink-0"
            >
              {solutionShown ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  Reveal solution
                </>
              )}
            </Button>
          </CardHeader>
          {solutionShown && (
            <CardContent className="border-t border-border p-0">
              <CodeViewer code={problem.content} language={problem.language} />
            </CardContent>
          )}
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Recall Note</CardTitle>
                <CardDescription className="mt-1">
                  The reasoning you want to be able to reconstruct: key idea, validation
                  function, edge cases, and progressive hints for recall sessions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <RecallNoteEditor
              key={`${problem.id}-${problem.recallNote?.hints.length ?? 'none'}`}
              problemId={problem.id}
              pattern={problem.pattern}
              note={problem.recallNote}
              onSaved={fetchProblem}
            />
          </CardContent>
        </Card>

        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-md border border-destructive/25 bg-destructive/10 p-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <CardTitle>Mistakes</CardTitle>
                  <CardDescription className="mt-1">
                    What tripped you up, as first-class data
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <MistakeLog
                problemId={problem.id}
                mistakes={problem.mistakes}
                onChanged={fetchProblem}
              />
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-md border border-info/25 bg-info/10 p-2">
                  <History className="h-4 w-4 text-info" />
                </div>
                <div>
                  <CardTitle>Attempt History</CardTitle>
                  <CardDescription className="mt-1">
                    Recall quality, hints used, and time per review
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AttemptHistory attempts={problem.attempts} />
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}

