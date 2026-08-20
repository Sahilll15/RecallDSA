'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/data-table';
import { cn, getDifficultyColor, formatDate, formatProblemTitle } from '@/lib/utils';
import { patternLabel } from '@/lib/constants';
import { Eye, Plus, ChevronDown, ChevronUp, ExternalLink, Files } from 'lucide-react';
import { CodeViewer } from './code-viewer';
import Link from 'next/link';

interface Problem {
  id: string;
  title: string;
  platform: string | null;
  difficulty: string | null;
  pattern: string | null;
  language: string | null;
  updatedAt: string;
  path: string;
  /** How many files in the repo hold this one problem. */
  fileCount?: number;
  revisions: Array<{ id: string; nextDate: string; lastRevised: string | null }>;
}

interface ProblemTableProps {
  problems: Problem[];
  onAddToRevision?: (problemId: string) => void;
  loading?: boolean;
}

function reviewState(problem: Problem): {
  label: string;
  tone: 'due' | 'scheduled' | 'untracked';
} {
  const revision = problem.revisions[0];
  if (!revision) return { label: 'Not tracked', tone: 'untracked' };

  const next = new Date(revision.nextDate);
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (next < endOfToday) {
    return { label: next < now ? 'Overdue' : 'Due today', tone: 'due' };
  }
  const days = Math.ceil((next.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  return { label: `Due in ${days}d`, tone: 'scheduled' };
}

const TONE_CLASSES = {
  due: 'border-destructive/30 bg-destructive/10 text-destructive',
  scheduled: 'border-info/30 bg-info/10 text-info',
  untracked: 'text-muted-foreground',
} as const;

export function ProblemTable({
  problems,
  onAddToRevision,
  loading,
}: ProblemTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [codeCache, setCodeCache] = useState<Record<string, string>>({});
  const [loadingCode, setLoadingCode] = useState<string | null>(null);

  const toggleRow = async (problemId: string) => {
    if (expandedRow === problemId) {
      setExpandedRow(null);
      return;
    }

    setExpandedRow(problemId);

    if (!codeCache[problemId]) {
      setLoadingCode(problemId);
      try {
        const response = await fetch(`/api/problems/${problemId}`);
        const data = await response.json();
        setCodeCache((prev) => ({ ...prev, [problemId]: data.content }));
      } catch (error) {
        console.error('Failed to load code:', error);
      } finally {
        setLoadingCode(null);
      }
    }
  };

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-surface">
      <Table>
        <TableHeader>
          <TableRow className="bg-surface-raised hover:bg-surface-raised">
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Problem</TableHead>
            <TableHead>Review</TableHead>
            <TableHead className="hidden lg:table-cell">Language</TableHead>
            <TableHead className="hidden xl:table-cell">Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {problems.map((problem) => {
            const state = reviewState(problem);
            return (
              <React.Fragment key={problem.id}>
                <tr className="group border-b border-border transition-colors last:border-0 hover:bg-surface-raised">
                  <TableCell>
                    <button
                      onClick={() => toggleRow(problem.id)}
                      className="p-1 hover:bg-primary/10 rounded-md transition-colors"
                      aria-label={expandedRow === problem.id ? 'Hide code' : 'Preview code'}
                    >
                      {expandedRow === problem.id ? (
                        <ChevronUp className="h-4 w-4 text-primary" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </TableCell>

                  <TableCell>
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/problems/${problem.id}`}
                          className="font-display text-sm font-semibold transition-colors hover:text-primary"
                        >
                          {formatProblemTitle(problem.title)}
                        </Link>
                        {(problem.fileCount ?? 1) > 1 && (
                          <Badge
                            variant="outline"
                            title={`${problem.fileCount} files in the repo hold this problem`}
                          >
                            <Files className="h-3 w-3" />
                            <span data-numeric>{problem.fileCount}</span> files
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {problem.pattern && (
                          <Badge variant="code">{patternLabel(problem.pattern)}</Badge>
                        )}
                        {problem.difficulty && (
                          <Badge className={getDifficultyColor(problem.difficulty)}>
                            {problem.difficulty}
                          </Badge>
                        )}
                        {problem.platform && (
                          <Badge variant="outline">{problem.platform}</Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    {state.tone === 'untracked' ? (
                      <span className="text-xs text-muted-foreground">Not tracked</span>
                    ) : (
                      <Badge className={cn('text-xs', TONE_CLASSES[state.tone])}>
                        {state.label}
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="hidden lg:table-cell">
                    {problem.language && <Badge variant="code">{problem.language}</Badge>}
                  </TableCell>

                  <TableCell
                    data-numeric
                    className="hidden font-mono text-xs text-muted-foreground xl:table-cell"
                  >
                    {formatDate(problem.updatedAt)}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      {problem.revisions.length === 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToRevision?.(problem.id);
                          }}
                          disabled={loading}
                          className="h-8"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          <span className="hidden sm:inline">Track</span>
                        </Button>
                      )}
                      <Link href={`/problems/${problem.id}`} aria-label="Open problem">
                        <Button size="sm" variant="ghost" className="h-8">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </tr>

                <AnimatePresence>
                  {expandedRow === problem.id && (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <TableCell colSpan={6} className="p-0 bg-muted/20">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          transition={{
                            duration: 0.3,
                            ease: [0.21, 0.47, 0.32, 0.98],
                          }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4 text-primary" />
                                <span className="text-sm font-semibold">
                                  Code Preview
                                </span>
                              </div>
                              <code className="rounded border border-border bg-surface px-2 py-1 font-mono text-xs text-muted-foreground">
                                {problem.path}
                              </code>
                            </div>

                            {loadingCode === problem.id ? (
                              <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                              </div>
                            ) : codeCache[problem.id] ? (
                              <div className="max-h-96 overflow-y-auto overflow-hidden rounded-[var(--radius)] border border-border">
                                <CodeViewer
                                  code={codeCache[problem.id]}
                                  language={problem.language || 'text'}
                                />
                              </div>
                            ) : (
                              <div className="text-center py-8 text-sm text-muted-foreground">
                                Failed to load code
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </TableCell>
                    </motion.tr>
                  )}
                </AnimatePresence>
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
