import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildActivityCalendar } from '@/lib/activity';

const DEFAULT_DAYS = 364;
const MAX_DAYS = 730;

/** Reviews per day, for the consistency calendar. */
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const requested = Number(request.nextUrl.searchParams.get('days'));
    const days =
      Number.isFinite(requested) && requested > 0
        ? Math.min(Math.floor(requested), MAX_DAYS)
        : DEFAULT_DAYS;

    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1));

    const attempts = await prisma.attempt.findMany({
      where: { userId: session.user.id, createdAt: { gte: since } },
      select: { createdAt: true },
    });

    return NextResponse.json(
      buildActivityCalendar(
        attempts.map((a) => a.createdAt),
        { days, today: new Date() },
      ),
    );
  } catch (error) {
    console.error('Failed to fetch activity:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}
