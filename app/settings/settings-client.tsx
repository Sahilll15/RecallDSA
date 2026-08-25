'use client';


import { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { AnimatedBackground } from '@/components/ui/animated-background';
import {
  AnimatedCard,
  AnimatedCardContent,
  AnimatedCardDescription,
  AnimatedCardHeader,
  AnimatedCardTitle,
} from '@/components/ui/animated-card';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Github,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Copy,
  ArrowRight,
  Zap,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react';
import { Footer } from '@/components/footer';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Repo {
  id: string;
  fullName: string;
  defaultBranch: string;
  webhookSecret: string | null;
  _count: {
    problems: number;
  };
}

interface AvailableRepo {
  id: number;
  full_name: string;
}

interface SyncResult {
  added: number;
  updated: number;
  removed?: number;
  scheduled?: number;
}

export default function SettingsPage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [availableRepos, setAvailableRepos] = useState<AvailableRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reposError, setReposError] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // A rejected/non-ok response must not collapse to "no repo connected yet":
  // that silently steers an auth or server hiccup into the first-run setup
  // screen instead of a visible error.
  const fetchJsonArray = async (url: string): Promise<unknown[] | null> => {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const data = await response.json();
      return Array.isArray(data) ? data : null;
    } catch {
      return null;
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const [reposRes, availableRes] = await Promise.all([
      fetchJsonArray('/api/repos/connect'),
      fetchJsonArray('/api/repos'),
    ]);

    setReposError(reposRes === null);
    if (reposRes !== null) {
      setRepos(reposRes as Repo[]);
    }
    if (availableRes !== null) {
      setAvailableRepos(availableRes as AvailableRepo[]);
    }
    setLoading(false);
  };

  const connectRepo = async () => {
    if (!selectedRepo) return;
    setConnecting(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/repos/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: selectedRepo }),
      });
      const newRepo = await response.json();
      if (!response.ok) {
        throw new Error(newRepo?.error || 'Failed to connect the repository');
      }
      await syncRepo(newRepo.id);
      await fetchData();
      setSelectedRepo('');
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Failed to connect the repository');
    } finally {
      setConnecting(false);
    }
  };

  const syncRepo = async (repoId: string) => {
    setSyncing(true);
    setSyncResult(null);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/repos/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoId }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Sync failed');
      }
      setSyncResult(result);
      await fetchData();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const connectedRepo = repos[0];
  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/github/webhook`
      : 'https://recall-dsa.vercel.app/api/github/webhook';

  return (
    <div className="relative flex min-h-screen flex-col">
      <AnimatedBackground />
      <Header />

      <main className="container relative mx-auto max-w-4xl flex-1 space-y-8 px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="border-b border-border pb-6"
        >
          <p className="eyebrow mb-2">Setup</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight mb-1.5">
            Which repo holds your solved problems?
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Pick one GitHub repository. RecallDSA imports code files immediately, then
            you choose the first problems to add to recall.
          </p>
        </motion.div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-soft rounded-md">
                <Github className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  {reposError
                    ? "Couldn't check your repository"
                    : connectedRepo
                      ? 'Repository connected'
                      : 'Choose one repository'}
                </CardTitle>
                <CardDescription>
                  {reposError
                    ? 'This looks like a temporary loading error, not an unconnected repo.'
                    : connectedRepo
                      ? 'Your queue can now stay in sync with this source.'
                      : 'This is the only setup question needed for the first import.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {errorMessage && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Something went wrong</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            ) : reposError ? (
              <div className="space-y-4">
                <div className="rounded-[var(--radius)] border border-destructive/25 bg-destructive/5 p-5 text-center">
                  <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
                  <p className="font-display text-base font-semibold">
                    Couldn&apos;t load your repository status.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This is a loading error, not a sign you need to reconnect anything.
                  </p>
                </div>
                <Button size="lg" onClick={fetchData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try again
                </Button>
              </div>
            ) : connectedRepo ? (
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-[var(--radius)] border border-primary/25 bg-primary-soft p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="success" className="mb-2">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      </div>
                      <p className="font-bold text-xl mb-2">
                        {connectedRepo.fullName}
                      </p>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Sparkles className="h-4 w-4" />
                          {connectedRepo._count.problems} problems
                        </span>
                        <span className="flex items-center gap-1">
                          <LinkIcon className="h-4 w-4" />
                          {connectedRepo.defaultBranch} branch
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => syncRepo(connectedRepo.id)}
                      disabled={syncing}
                      variant="outline"
                      className="group"
                    >
                      <RefreshCw
                        className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`}
                      />
                      {syncing ? 'Syncing...' : 'Sync Now'}
                    </Button>
                  </div>
                </div>

                {syncResult && (
                  <Alert variant="success">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Import complete</AlertTitle>
                    <AlertDescription>
                      Added {syncResult.added} new problems, updated {syncResult.updated}
                      {typeof syncResult.removed === 'number' && syncResult.removed > 0
                        ? `, removed ${syncResult.removed} deleted from the repo`
                        : ''}
                      {typeof syncResult.scheduled === 'number' && syncResult.scheduled > 0
                        ? `, queued ${syncResult.scheduled} for recall`
                        : ''}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link href="/problems">
                    <Button size="lg" className="group w-full sm:w-auto">
                      Track imported problems
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </Link>
                  <Link href="/revision">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      Open revision queue
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-[var(--radius)] border border-border bg-surface-raised p-5">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-border bg-background">
                    <Github className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="font-display text-base font-semibold">
                    Connect the repo where you push accepted solutions.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Import runs after connection, so the next screen can be your problem library.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select
                    value={selectedRepo}
                    onChange={(e) => setSelectedRepo(e.target.value)}
                    className="flex-1"
                  >
                    <option value="">Select a repository</option>
                    {availableRepos.map((repo) => (
                      <option key={repo.id} value={repo.full_name}>
                        {repo.full_name}
                      </option>
                    ))}
                  </Select>
                  <Button
                    onClick={connectRepo}
                    disabled={!selectedRepo || connecting}
                    size="lg"
                    className="group whitespace-nowrap"
                  >
                    <Github className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                    {connecting ? 'Importing...' : 'Connect and import'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {connectedRepo && (
          <details className="rounded-[var(--radius)] border border-border bg-surface">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
              <span className="flex items-center gap-3">
                <span className="rounded-md border border-info/25 bg-info-soft p-2.5">
                  <Zap className="h-5 w-5 text-info" />
                </span>
                <span>
                  <span className="block font-display text-base font-semibold">
                    Advanced: automatic sync on push
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    Optional webhook setup after the first queue is working.
                  </span>
                </span>
              </span>
              <Badge variant="outline">Optional</Badge>
            </summary>
            <div className="space-y-6 border-t border-border p-5">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Setup Instructions</AlertTitle>
                <AlertDescription>
                  <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>Go to your repository on GitHub</li>
                    <li>Navigate to Settings → Webhooks → Add webhook</li>
                    <li>Copy and paste the values below</li>
                    <li>Select &quot;Just the push event&quot;</li>
                    <li>Click &quot;Add webhook&quot;</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Payload URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={webhookUrl}
                      readOnly
                      className="flex-1 px-4 py-2.5 border-2 rounded-lg bg-muted text-sm font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(webhookUrl)}
                      className="shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Content type</label>
                  <input
                    type="text"
                    value="application/json"
                    readOnly
                    className="w-full px-4 py-2.5 border-2 rounded-lg bg-muted text-sm font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Secret</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={connectedRepo.webhookSecret || ''}
                      readOnly
                      className="flex-1 px-4 py-2.5 border-2 rounded-lg bg-muted text-sm font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        copyToClipboard(connectedRepo.webhookSecret || '')
                      }
                      className="shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Events</label>
                  <div>
                    <Badge variant="outline" className="text-sm">
                      push
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </details>
        )}
      </main>

      <Footer />
    </div>
  );
}
