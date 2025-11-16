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
import { getDifficultyColor, getPlatformColor, formatDate } from '@/lib/utils';
import {
  Code2,
  Eye,
  Plus,
  CheckCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { CodeViewer } from './code-viewer';
import Link from 'next/link';

interface Problem {
  id: string;
  title: string;
  platform: string | null;
  difficulty: string | null;
  language: string | null;
  updatedAt: string;
  path: string;
  revisions: any[];
}

interface ProblemTableProps {
  problems: Problem[];
  onAddToRevision?: (problemId: string) => void;
  loading?: boolean;
}

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
    <div className="rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Problem</TableHead>
            <TableHead className="hidden md:table-cell">Platform</TableHead>
            <TableHead className="hidden md:table-cell">Difficulty</TableHead>
            <TableHead className="hidden lg:table-cell">Language</TableHead>
            <TableHead className="hidden xl:table-cell">Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {problems.map((problem, index) => (
            <React.Fragment key={problem.id}>
              <motion.tr
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.2 }}
                className="group hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <TableCell>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleRow(problem.id)}
                    className="p-1 hover:bg-primary/10 rounded-md transition-colors"
                  >
                    {expandedRow === problem.id ? (
                      <ChevronUp className="h-4 w-4 text-primary" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </motion.button>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-primary/10 rounded-md">
                      <Code2 className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">
                        {problem.title}
                      </div>
                      <div className="md:hidden flex flex-wrap gap-1 mt-1">
                        {problem.platform && (
                          <Badge variant="outline" className="text-xs h-5">
                            {problem.platform}
                          </Badge>
                        )}
                        {problem.difficulty && (
                          <Badge
                            className={cn(
                              'text-xs h-5',
                              getDifficultyColor(problem.difficulty),
                            )}
                          >
                            {problem.difficulty}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  {problem.platform && (
                    <Badge
                      variant="outline"
                      className={getPlatformColor(problem.platform)}
                    >
                      {problem.platform}
                    </Badge>
                  )}
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  {problem.difficulty && (
                    <Badge className={getDifficultyColor(problem.difficulty)}>
                      {problem.difficulty}
                    </Badge>
                  )}
                </TableCell>

                <TableCell className="hidden lg:table-cell">
                  {problem.language && (
                    <Badge variant="outline">{problem.language}</Badge>
                  )}
                </TableCell>

                <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                  {formatDate(problem.updatedAt)}
                </TableCell>

                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    {problem.revisions.length > 0 ? (
                      <Badge variant="success" className="text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Tracking
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
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
                    <Link href={`/problems/${problem.id}`}>
                      <Button size="sm" variant="ghost" className="h-8">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </motion.tr>

              <AnimatePresence>
                {expandedRow === problem.id && (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TableCell colSpan={7} className="p-0 bg-muted/20">
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
                            <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                              {problem.path}
                            </code>
                          </div>

                          {loadingCode === problem.id ? (
                            <div className="flex items-center justify-center py-12">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                          ) : codeCache[problem.id] ? (
                            <div className="rounded-lg overflow-hidden border border-border/50 max-h-96 overflow-y-auto">
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
