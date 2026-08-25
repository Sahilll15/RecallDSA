'use client'

import { useCallback, useEffect, useState } from 'react'
import { Header } from '@/components/header'
import { AnimatedCard, AnimatedCardContent, AnimatedCardHeader, AnimatedCardTitle, AnimatedCardDescription } from '@/components/ui/animated-card'
import { AnimatedBackground } from '@/components/ui/animated-background'
import { ProblemTable } from '@/components/problem-table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PATTERNS } from '@/lib/constants'
import { Search, Filter, Code2, ChevronLeft, ChevronRight, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Footer } from '@/components/footer'
import { motion } from 'framer-motion'

interface Repo {
  id: string
}

interface SyncResult {
  total: number
  added: number
  updated: number
  scheduled?: number
  duplicatesSkipped?: number
}

interface Problem {
  id: string
  title: string
  platform: string | null
  difficulty: string | null
  pattern: string | null
  language: string | null
  path: string
  updatedAt: string
  fileCount?: number
  revisions: Array<{ id: string; nextDate: string; lastRevised: string | null }>
}

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [repos, setRepos] = useState<Repo[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [platform, setPlatform] = useState("")
  const [difficulty, setDifficulty] = useState("")
  const [language, setLanguage] = useState("")
  const [pattern, setPattern] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reposError, setReposError] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // A filter change can strand `page` past the new result set, so jump back to 1.
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, platform, difficulty, language, pattern])

  const fetchProblems = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    const params = new URLSearchParams()
    if (debouncedSearch) params.append('search', debouncedSearch)
    if (platform) params.append('platform', platform)
    if (difficulty) params.append('difficulty', difficulty)
    if (language) params.append('language', language)
    if (pattern) params.append('pattern', pattern)
    params.append('page', page.toString())

    try {
      const response = await fetch(`/api/problems?${params}`)
      if (!response.ok) throw new Error(`Request failed with ${response.status}`)
      const data = await response.json()
      setProblems(data.problems || [])
      setTotalPages(data.pages || 1)
    } catch (error) {
      // A failed request must not read as "you have zero problems": that
      // silently steers into the "connect a repo" onboarding card instead.
      console.error('Failed to fetch problems:', error)
      setLoadError('Could not load your problems. Try refreshing the page.')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, platform, difficulty, language, pattern, page])

  const fetchRepos = async () => {
    try {
      const response = await fetch('/api/repos/connect')
      if (!response.ok) throw new Error(`Request failed with ${response.status}`)
      const data = await response.json()
      setRepos(Array.isArray(data) ? data : [])
      setReposError(false)
    } catch (error) {
      setReposError(true)
      console.error('Failed to fetch repos:', error)
    }
  }

  const syncRepo = async () => {
    if (repos.length === 0) return
    
    setSyncing(true)
    setSyncResult(null)
    try {
      const response = await fetch('/api/repos/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoId: repos[0].id }),
      })
      const result = await response.json()
      setSyncResult(result)
      await fetchProblems()
      setTimeout(() => setSyncResult(null), 5000)
    } catch (error) {
      console.error('Failed to sync:', error)
    } finally {
      setSyncing(false)
    }
  }

  const addToRevision = async (problemId: string) => {
    setActionLoading(true)
    try {
      await fetch('/api/revisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId }),
      })
      await fetchProblems()
    } catch (error) {
      console.error('Failed to add to revision:', error)
    } finally {
      setActionLoading(false)
    }
  }

  useEffect(() => {
    fetchProblems()
    fetchRepos()
  }, [fetchProblems])

  return (
    <div className="relative flex min-h-screen flex-col">
      <AnimatedBackground />
      <Header />
      
      <main className="container relative mx-auto max-w-6xl flex-1 space-y-7 px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border pb-6"
        >
          <div className="space-y-2">
            <p className="eyebrow">Library</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Problems
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Your synced library, one row per problem. Track a problem to put it on the
              recall schedule.
            </p>
          </div>
          {repos.length > 0 && (
            <Button
              onClick={syncRepo}
              disabled={syncing}
              variant="outline"
              className="shrink-0"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing' : 'Sync from GitHub'}
            </Button>
          )}
        </motion.div>

        {syncResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Alert className="border-success/50 bg-success/5">
              <CheckCircle className="h-4 w-4 text-success" />
              <AlertDescription>
                Synced <strong data-numeric>{syncResult.total}</strong> code files:{' '}
                <strong data-numeric>{syncResult.added}</strong> added,{' '}
                <strong data-numeric>{syncResult.updated}</strong> updated
                {(syncResult.scheduled ?? 0) > 0 && (
                  <>
                    , <strong data-numeric>{syncResult.scheduled}</strong> queued for recall
                  </>
                )}
                {(syncResult.duplicatesSkipped ?? 0) > 0 && (
                  <>
                    . <strong data-numeric>{syncResult.duplicatesSkipped}</strong> file
                    {syncResult.duplicatesSkipped === 1 ? '' : 's'} skipped as another copy of a
                    problem already queued
                  </>
                )}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <Card>
          <CardHeader className="pb-4">
            <p className="eyebrow flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-primary" />
              Filters
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search problems"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  aria-label="Search problems"
                />
              </div>

              <Select value={pattern} onChange={(e) => setPattern(e.target.value)}>
                <option value="">All Patterns</option>
                {PATTERNS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>

              <Select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                <option value="">All Platforms</option>
                <option value="leetcode">LeetCode</option>
                <option value="gfg">GeeksforGeeks</option>
                <option value="codeforces">Codeforces</option>
                <option value="codechef">CodeChef</option>
                <option value="lld">Low Level Design</option>
              </Select>

              <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </Select>

              <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="">All Languages</option>
                <option value="cpp">C++</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="javascript">JavaScript</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
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
                </CardContent>
              </Card>
            ))}
          </div>
        ) : loadError ? (
          <Card className="border-dashed border-2 border-destructive/40">
            <CardContent className="p-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <p className="text-lg font-semibold mb-2">Couldn&apos;t load your problems</p>
              <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">{loadError}</p>
              <Button size="lg" onClick={fetchProblems}>
                <RefreshCw className="h-4 w-4" />
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : problems.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Code2 className="h-8 w-8 text-muted-foreground" />
              </div>
              {reposError ? (
                <>
                  <p className="text-lg font-semibold mb-2">Couldn&apos;t check your connected repo</p>
                  <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">
                    This looks like a temporary loading error, not an unconnected repo.
                  </p>
                  <Button size="lg" onClick={fetchRepos}>
                    <RefreshCw className="h-4 w-4" />
                    Try again
                  </Button>
                </>
              ) : repos.length === 0 ? (
                <>
                  <p className="text-lg font-semibold mb-2">Connect a repository first</p>
                  <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">
                    Problems appear here after RecallDSA imports solved code files from GitHub.
                  </p>
                  <Link href="/settings">
                    <Button size="lg">Choose GitHub repo</Button>
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold mb-2">No problems match this view</p>
                  <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">
                    Adjust the filters above or sync your repository to import the latest solved files.
                  </p>
                  <div className="flex flex-col justify-center gap-3 sm:flex-row">
                    <Button onClick={syncRepo} disabled={syncing}>
                      <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                      {syncing ? 'Syncing' : 'Sync from GitHub'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <ProblemTable 
              problems={problems} 
              onAddToRevision={addToRevision}
              loading={actionLoading}
            />

            {totalPages > 1 && (
              <Card className="shadow-md">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                      Page <span className="font-semibold text-foreground">{page}</span> of{' '}
                      <span className="font-semibold text-foreground">{totalPages}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
      
      <Footer />
    </div>
  )
}
