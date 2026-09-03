import { auth } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ladderProblem } from '@/lib/pattern-ladder';
import { SolveClient } from './solve-client';

export default async function SolvePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/');
  }

  const { slug } = await params;
  const found = ladderProblem(slug);
  if (!found) notFound();

  const history = await prisma.practiceAttempt.findMany({
    where: { userId: session.user.id, slug: found.problem.slug },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      outcome: true,
      durationSec: true,
      patternGuess: true,
      createdAt: true,
      debtDueAt: true,
      debtClearedAt: true,
    },
  });

  return (
    <SolveClient
      user={session.user}
      rung={found.rung}
      problem={found.problem}
      history={history.map((attempt) => ({
        id: attempt.id,
        outcome: attempt.outcome,
        durationSec: attempt.durationSec,
        patternGuess: attempt.patternGuess,
        createdAt: attempt.createdAt.toISOString(),
        owes: attempt.debtDueAt !== null && attempt.debtClearedAt === null,
      }))}
    />
  );
}
