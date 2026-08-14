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

  Zap,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react';
import { Footer } from '@/components/footer';
import { motion } from 'framer-motion';

interface Repo {
  id: string;
  fullName: string;
  defaultBranch: string;
  webhookSecret: string | null;
  _count: {
    problems: number;
  };
}

export default function SettingsPage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [availableRepos, setAvailableRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [syncResult, setSyncResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [reposRes, availableRes] = await Promise.all([
      fetch('/api/repos/connect')
        .then((r) => r.json())
        .catch(() => []),
      fetch('/api/repos')
        .then((r) => r.json())
        .catch(() => []),
    ]);

    if (Array.isArray(reposRes)) {
      setRepos(reposRes);
    }
    if (Array.isArray(availableRes)) {
      setAvailableRepos(availableRes);
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
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <Header />

      <main className="container relative mx-auto px-4 py-8 max-w-4xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="border-b border-border pb-6"
        >
          <h1 className="text-3xl font-bold tracking-tight mb-1.5">Settings</h1>
          <p className="text-muted-foreground">
            Manage your repository connection and webhook sync
          </p>
        </motion.div>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Github className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Connected Repository</CardTitle>
                <CardDescription>
                  Link your DSA GitHub repository to start tracking
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
            ) : connectedRepo ? (
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-xl border-2 border-primary/20 bg-primary/5 p-6">
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
                    <AlertTitle>Sync completed successfully!</AlertTitle>
                    <AlertDescription>
                      Added {syncResult.added} new problems, updated {syncResult.updated}
                      {typeof syncResult.removed === 'number' && syncResult.removed > 0
                        ? `, removed ${syncResult.removed} deleted from the repo`
                        : ''}
                    </AlertDescription>
                  </Alert>
                )}

              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                    <Github className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    No repository connected yet. Select one below to get started
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select
                    value={selectedRepo}
                    onChange={(e) => setSelectedRepo(e.target.value)}
                    className="flex-1"
                  >
                    <option value="">Select a repository...</option>
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
                    {connecting ? 'Connecting...' : 'Connect Repository'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {connectedRepo && (
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl">
                  <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">
                    GitHub Webhook Setup
                  </CardTitle>
                  <CardDescription>
                    Enable automatic sync on every push
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
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
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
