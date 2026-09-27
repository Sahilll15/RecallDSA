import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sanitizeGraphDone } from '@/lib/graph-track';

export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 32 * 1024;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const row = await prisma.graphTrackProgress.findUnique({
      where: { userId: session.user.id },
      select: { state: true },
    });
    const state = row?.state as { done?: unknown } | null | undefined;
    return NextResponse.json({ done: row ? sanitizeGraphDone(state?.done) : null });
  } catch (error) {
    console.error('Failed to load graph track progress:', error);
    return NextResponse.json({ error: 'Failed to load progress' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Progress document too large' }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const done = sanitizeGraphDone(
    typeof body === 'object' && body !== null ? (body as { done?: unknown }).done : null,
  );

  try {
    await prisma.graphTrackProgress.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, state: { done } },
      update: { state: { done } },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to save graph track progress:', error);
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
  }
}
