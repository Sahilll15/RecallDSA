import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { rebalanceQueue } from '@/lib/daily-cap-store';

/**
 * mode "cap" keeps today at the daily cap and pushes the rest forward.
 * mode "restart" clears today entirely and spreads everything due from tomorrow.
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { mode?: unknown; tzOffsetMinutes?: unknown } = {};
  try {
    body = await request.json();
  } catch {}

  const tz = Number(body.tzOffsetMinutes);
  const tzOffsetMinutes = Number.isFinite(tz) && Math.abs(tz) <= 14 * 60 ? tz : 0;

  try {
    const moved = await rebalanceQueue(session.user.id, {
      tzOffsetMinutes,
      ...(body.mode === 'restart' ? { keepToday: 0 } : {}),
    });
    return NextResponse.json({ moved });
  } catch (error) {
    console.error('Failed to rebalance revisions:', error);
    return NextResponse.json({ error: 'Failed to rebalance revisions' }, { status: 500 });
  }
}
