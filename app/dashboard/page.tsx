import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { DashboardClient } from './dashboard-client';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/');
  }

  const repos = await prisma.repo.findMany({
    where: { userId: session.user.id },
    include: {
      _count: {
        select: { problems: true },
      },
    },
  });

  const totalProblems = repos.reduce(
    (sum, repo) => sum + repo._count.problems,
    0,
  );

  const problemsByPlatform = await prisma.problem.groupBy({
    by: ['platform'],
    where: {
      repo: {
        userId: session.user.id,
      },
    },
    _count: true,
  });

  const problemsByDifficulty = await prisma.problem.groupBy({
    by: ['difficulty'],
    where: {
      repo: {
        userId: session.user.id,
      },
    },
    _count: true,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const [totalRevisions, dueToday, dueThisWeek, overdue] = await Promise.all([
    prisma.revision.count({
      where: { userId: session.user.id },
    }),
    prisma.revision.count({
      where: {
        userId: session.user.id,
        nextDate: {
          lte: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.revision.count({
      where: {
        userId: session.user.id,
        nextDate: {
          gte: today,
          lte: nextWeek,
        },
      },
    }),
    prisma.revision.count({
      where: {
        userId: session.user.id,
        nextDate: {
          lt: today,
        },
      },
    }),
  ]);

  return (
    <DashboardClient
      user={session.user}
      stats={{
        totalProblems,
        totalRevisions,
        dueToday,
        dueThisWeek,
        overdue,
        repos: repos.length,
      }}
      problemsByPlatform={problemsByPlatform}
      problemsByDifficulty={problemsByDifficulty}
    />
  );
}
