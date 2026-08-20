'use client';

import { useCallback, useEffect, useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, ExternalLink, Lightbulb } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, getDifficultyColor } from '@/lib/utils';

interface Statement {
  available: boolean;
  slug: string;
  number?: string | null;
  title?: string;
  difficulty?: string | null;
  tags?: string[];
  hints?: string[];
  url: string;
  contentHtml?: string;
}

/**
 * The question itself, read before any recall. Hints stay folded away: seeing
 * them for free would defeat the exercise.
 */
export function ProblemStatement({
  problemId,
  collapsible = true,
  defaultOpen = true,
  className,
}: {
  problemId: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [statement, setStatement] = useState<Statement | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(defaultOpen);
  const [hintsShown, setHintsShown] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/problems/${problemId}/statement`);
      setStatement(res.ok ? await res.json() : null);
    } catch {
      setStatement(null);
    } finally {
      setLoading(false);
    }
  }, [problemId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!statement) return null;

  if (!statement.available) {
    return (
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground',
          className,
        )}
      >
        <span>
          No statement found for{' '}
          <code className="font-mono text-xs text-foreground">{statement.slug}</code>. It may
          be from another judge.
        </span>
        <a href={statement.url} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">
            Search LeetCode
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </a>
      </div>
    );
  }

  const hints = statement.hints ?? [];

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="eyebrow flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            Question
          </p>
          {statement.number && <Badge variant="code">#{statement.number}</Badge>}
          {statement.difficulty && (
            <Badge className={getDifficultyColor(statement.difficulty)}>
              {statement.difficulty}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <a href={statement.url} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm">
              LeetCode
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </a>
          {collapsible && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
            >
              {open ? (
                <>
                  Hide
                  <ChevronUp className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  Read
                  <ChevronDown className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {open && (
        <>
          <div
            className="problem-statement"
            dangerouslySetInnerHTML={{ __html: statement.contentHtml ?? '' }}
          />

          {hints.length > 0 && (
            <div className="space-y-2 border-t border-border pt-3">
              {hintsShown < hints.length && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHintsShown((n) => n + 1)}
                  className="border-warning/40 text-warning hover:bg-warning/10"
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  Reveal hint {hintsShown + 1} of {hints.length}
                </Button>
              )}
              {hints.slice(0, hintsShown).map((hint, i) => (
                <div
                  key={i}
                  className="rounded-md border border-warning/30 bg-warning/[0.07] p-3 text-sm"
                >
                  <span className="mr-2 font-mono text-xs font-semibold uppercase tracking-wider text-warning">
                    Hint {i + 1}
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: hint }} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
