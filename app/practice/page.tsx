import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { loadPracticeState } from '@/lib/practice-store';
import { PracticeClient } from './practice-client';

export default async function PracticePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/');
  }

  const userId = session.user.id;

  const [state, attempts] = await Promise.all([
    loadPracticeState(userId),
    prisma.practiceAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { rungId: true, slug: true, outcome: true },
    }),
  ]);

  // Which problems read as cleared and which still owe something. Newest
  // attempt per problem wins, so a paid-off debt stops showing as owed.
  const byRung = new Map<string, { cleared: string[]; owed: string[] }>();
  const seen = new Set<string>();
  for (const attempt of attempts) {
    if (seen.has(attempt.slug)) continue;
    seen.add(attempt.slug);
    const entry = byRung.get(attempt.rungId) ?? { cleared: [], owed: [] };
    if (attempt.outcome === 'unaided') entry.cleared.push(attempt.slug);
    else entry.owed.push(attempt.slug);
    byRung.set(attempt.rungId, entry);
  }

  return (
    <PracticeClient
      user={session.user}
      readiness={state.readiness}
      totals={state.totals}
      progress={Object.fromEntries(byRung)}
      debts={state.debts.map((debt) => ({ ...debt, dueAt: debt.dueAt.toISOString() }))}
    />
  );
}
