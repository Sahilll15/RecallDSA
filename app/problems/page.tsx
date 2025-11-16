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
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getDifficultyColor, getPlatformColor, formatDate } from '@/lib/utils'
import { Search, Filter, Code2, Clock, ChevronLeft, ChevronRight, Sparkles, ExternalLink, RefreshCw, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Footer } from '@/components/footer'
import { motion } from 'framer-motion'

interface Problem {
  id: string
  title: string
  platform: string | null
  difficulty: string | null
  language: string | null
  path: string
  updatedAt: string
  revisions: any[]
}

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [repos, setRepos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [platform, setPlatform] = useState("")
  const [difficulty, setDifficulty] = useState("")
  const [language, setLanguage] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchProblems = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (platform) params.append('platform', platform)
    if (difficulty) params.append('difficulty', difficulty)
    if (language) params.append('language', language)
    params.append('page', page.toString())

    const response = await fetch(`/api/problems?${params}`)
    const data = await response.json()
    setProblems(data.problems || [])
    setTotalPages(data.pages || 1)
    setLoading(false)
  }, [search, platform, difficulty, language, page])

  const fetchRepos = async () => {
    try {
      const response = await fetch('/api/repos/connect')
      const data = await response.json()
      setRepos(Array.isArray(data) ? data : [])
    } catch (error) {
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
            <div className="flex items-start justify-between gap-4 mb-4">
              <Badge>
                <Code2 className="h-3 w-3 mr-2" />
                Problems Library
              </Badge>
              {repos.length > 0 && (
                <Button
                  onClick={syncRepo}
                  disabled={syncing}
                  size="sm"
                  variant="outline"
                  className="bg-background/50 backdrop-blur-sm"
                >
                  <RefreshCw className={`h-3.5 w-3.5 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync Problems'}
                </Button>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              Browse{' '}
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Problems
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Explore and manage your DSA problem collection. Click on any row to preview code.
            </p>
          </div>
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
                Sync completed: <strong>{syncResult.added}</strong> problems added, 
                <strong> {syncResult.updated}</strong> updated out of <strong>{syncResult.total}</strong> code files
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Filter className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle>Filters</CardTitle>
                <CardDescription>Refine your problem search</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search problems..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                <option value="">All Platforms</option>
                <option value="leetcode">LeetCode</option>
                <option value="gfg">GeeksforGeeks</option>
                <option value="codeforces">Codeforces</option>
                <option value="codechef">CodeChef</option>
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
        ) : problems.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Code2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold mb-2">No problems found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or add problems to your repository
              </p>
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

