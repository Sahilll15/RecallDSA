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
import { getDifficultyColor, getPlatformColor, formatRelativeDate } from '@/lib/utils'
import { Calendar, CheckCircle, Plus, Trash2, Code2, Clock, TrendingUp, Sparkles, FileCode } from 'lucide-react'
import { Footer } from '@/components/footer'

interface ProblemData {
  id: string
  title: string
  platform: string | null
  difficulty: string | null
  language: string | null
  path: string
  content: string
  updatedAt: string
  revisions: Array<{
    id: string
    nextDate: string
    lastRevised: string | null
    intervalDays: number
  }>
}

export default function ProblemDetailPage() {
  const params = useParams()
  const problemId = Array.isArray(params.id) ? params.id[0] : params.id
  const [problem, setProblem] = useState<ProblemData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

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

  const markAsRevised = async () => {
    if (!problem?.revisions[0]?.id) return
    setActionLoading(true)
    await fetch(`/api/revisions/${problem.revisions[0].id}/complete`, {
      method: 'POST',
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
                The problem you're looking for doesn't exist or has been removed
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
            <Badge className="mb-4">
              <FileCode className="h-3 w-3 mr-2" />
              Problem Details
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              {problem.title}
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

            <p className="text-sm text-muted-foreground font-mono bg-muted/50 px-3 py-2 rounded-lg inline-block mb-6">
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
                <>
                  <Button 
                    onClick={markAsRevised} 
                    disabled={actionLoading}
                    size="lg"
                    className="group"
                  >
                    <CheckCircle className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                    Mark as Revised
                  </Button>
                  <Button
                    variant="outline"
                    onClick={removeFromRevision}
                    disabled={actionLoading}
                    size="lg"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove from Revision
                  </Button>
                </>
              )}
            </div>
          </div>

          {revision && (
            <Alert className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
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
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Card className="shadow-lg overflow-hidden">
          <CardHeader className="bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-lg">
                <Code2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Solution Code</CardTitle>
                <CardDescription className="mt-1">
                  Your implementation for this problem
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <CodeViewer code={problem.content} language={problem.language} />
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  )
}

