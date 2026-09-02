import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { mergeProgress } from '@/lib/roadmap/progress';

export const dynamic = 'force-dynamic';

/** Notes are the only free text; 256 KB is far above any real document. */
const MAX_BODY_BYTES = 256 * 1024;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const row = await prisma.roadmapProgress.findUnique({
      where: { userId: session.user.id },
      select: { state: true, updatedAt: true },
    });
    return NextResponse.json({
      state: row ? mergeProgress(row.state) : null,
      updatedAt: row?.updatedAt ?? null,
    });
  } catch (error) {
    console.error('Failed to load roadmap progress:', error);
    return NextResponse.json({ error: 'Failed to load roadmap progress' }, { status: 500 });
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

  const state = mergeProgress(
    typeof body === 'object' && body !== null ? (body as { state?: unknown }).state : null,
  );

  try {
    const row = await prisma.roadmapProgress.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, state: state as unknown as Prisma.InputJsonValue },
      update: { state: state as unknown as Prisma.InputJsonValue },
      select: { updatedAt: true },
    });
    return NextResponse.json({ ok: true, updatedAt: row.updatedAt });
  } catch (error) {
    console.error('Failed to save roadmap progress:', error);
    return NextResponse.json({ error: 'Failed to save roadmap progress' }, { status: 500 });
  }
}
