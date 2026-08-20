'use client';

import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { RATING_LABELS, type RecallRating } from '@/lib/spaced-repetition';
import { CheckCircle, Clock, Lightbulb, XCircle } from 'lucide-react';

export interface AttemptData {
  id: string;
  rating: string;
  patternRecognized: boolean | null;
  hintsUsed: number;
  durationSec: number | null;
  createdAt: string;
}

const RATING_VARIANT: Record<RecallRating, 'destructive' | 'warning' | 'default' | 'success'> = {
  again: 'destructive',
  hard: 'warning',
  good: 'default',
  easy: 'success',
};

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  return `${Math.round(sec / 60)}m`;
}

export function AttemptHistory({ attempts }: { attempts: AttemptData[] }) {
  if (attempts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No recall attempts yet. Reviews you complete show up here with hints used and time taken,
        so you can watch reconstruction get faster.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {attempts.map((attempt) => {
        const rating = attempt.rating as RecallRating;
        return (
          <div
            key={attempt.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-border/50 px-3 py-2.5 text-sm"
          >
            <Badge variant={RATING_VARIANT[rating] ?? 'default'}>
              {RATING_LABELS[rating] ?? attempt.rating}
            </Badge>
            {attempt.patternRecognized !== null &&
              (attempt.patternRecognized ? (
                <span className="flex items-center gap-1 text-primary">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Pattern
                </span>
              ) : (
                <span className="flex items-center gap-1 text-destructive">
                  <XCircle className="h-3.5 w-3.5" />
                  Pattern
                </span>
              ))}
            {attempt.hintsUsed > 0 && (
              <span className="flex items-center gap-1 text-warning">
                <Lightbulb className="h-3.5 w-3.5" />
                {attempt.hintsUsed} hint{attempt.hintsUsed === 1 ? '' : 's'}
              </span>
            )}
            {attempt.durationSec !== null && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(attempt.durationSec)}
              </span>
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              {formatDate(attempt.createdAt)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
