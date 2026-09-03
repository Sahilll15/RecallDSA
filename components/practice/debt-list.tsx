'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { OUTCOME_LABELS } from '@/lib/practice';
import type { SolveOutcome } from '@/lib/practice';
import type { LadderDifficulty, LadderTier } from '@/lib/pattern-ladder';
import { cn } from '@/lib/utils';

export interface DebtItem {
  id: string;
  slug: string;
  title: string;
  rungName: string;
  tier: LadderTier;
  difficulty: LadderDifficulty;
  outcome: SolveOutcome;
  /** Serialised for the client boundary. */
  dueAt: string;
  overdue: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Calendar days, not elapsed hours. A debt booked for midnight two days out is
 * 1.3 days away by the clock, and rounding that reads as "due tomorrow".
 */
function dueLabel(dueAt: string, overdue: boolean): string {
  const due = new Date(dueAt);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - today.getTime()) / DAY_MS);

  if (overdue) return days < 0 ? `${Math.abs(days)}d overdue` : 'due today';
  return days === 1 ? 'due tomorrow' : `in ${days}d`;
}

/**
 * Problems read rather than derived. Listed as a debt rather than folded into
 * the recall queue, because the queue schedules things you can already do and
 * these are the ones you cannot.
 */
export function DebtList({ debts }: { debts: DebtItem[] }) {
  const router = useRouter();
  const [clearing, setClearing] = useState<string | null>(null);

  const clear = async (id: string) => {
    setClearing(id);
    try {
      const res = await fetch(`/api/practice/debt/${id}/clear`, { method: 'POST' });
      if (res.ok) router.refresh();
    } finally {
      setClearing(null);
    }
  };

  if (debts.length === 0) return null;

  const overdue = debts.filter((d) => d.overdue).length;

  return (
    <Card className={cn(overdue > 0 && 'border-warning/40')}>
      <CardContent className="space-y-4 p-5">
        <div className="space-y-1">
          <p className="eyebrow flex items-center gap-1.5">
            <AlertTriangle
              className={cn('h-3.5 w-3.5', overdue > 0 ? 'text-warning' : 'text-muted-foreground')}
            />
            Re-derives owed
          </p>
          <p className="text-sm text-muted-foreground">
            Open each one, close everything else, and derive it from blank. Logging it unaided
            settles the debt; anything less keeps it open.
          </p>
        </div>

        <ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
          {debts.map((debt) => (
            <li key={debt.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="truncate font-medium">{debt.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {debt.rungName} &middot; {OUTCOME_LABELS[debt.outcome]}
                </p>
              </div>

              <Badge variant={debt.overdue ? 'warning' : 'outline'} className="shrink-0">
                {dueLabel(debt.dueAt, debt.overdue)}
              </Badge>

              <Link href={`/practice/solve/${debt.slug}`} className="shrink-0">
                <Button size="sm" variant="outline">
                  Re-derive
                </Button>
              </Link>

              <Button
                size="sm"
                variant="ghost"
                disabled={clearing === debt.id}
                onClick={() => clear(debt.id)}
                aria-label={`Mark ${debt.title} paid`}
                title="Already re-derived outside the app"
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
