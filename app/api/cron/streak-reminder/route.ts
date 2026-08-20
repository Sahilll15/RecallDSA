import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isEmailConfigured, sendStreakReminder } from '@/lib/email';
import { buildActivityCalendar } from '@/lib/activity';
import { dedupeRevisionQueue } from '@/lib/revision-queue';
import { fetchLeetCodeProblem } from '@/lib/leetcode';
import { leetCodeSlugFor } from '@/lib/pattern-detection';
import { patternLabel } from '@/lib/constants';
import { formatProblemTitle } from '@/lib/utils';
import {
  assessStreakRisk,
  buildStreakReminderEmail,
  type ReminderProblem,
} from '@/lib/streak-reminder';

/** Problems named in the email. The rest are summarised as a count. */
const LISTED_PROBLEMS = 5;
const STREAK_WINDOW_DAYS = 60;

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get('authorization');
  const query = request.nextUrl.searchParams.get('secret');
  return header === `Bearer ${secret}` || query === secret;
}

/**
 * Warns anyone whose streak is about to lapse. Sends only when the streak is
 * alive, nothing has been reviewed today, and there is something due, so a quiet
 * day never produces mail.
 */
export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json(
      {
        error: 'SMTP is not configured',
        detail: 'Set SMTP_HOST, SMTP_USER and SMTP_PASS to enable reminders.',
      },
      { status: 503 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://recall-dsa.vercel.app';
  const dryRun = request.nextUrl.searchParams.get('dryRun') === '1';

  try {
    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const since = new Date(now);
    since.setDate(since.getDate() - STREAK_WINDOW_DAYS);

    const users = await prisma.user.findMany({
      where: { email: { not: null } },
      select: { id: true, email: true, name: true },
    });

    const report: Array<{
      user: string;
      sent: boolean;
      reason: string;
      streakDays: number;
      dueCount: number;
    }> = [];

    for (const user of users) {
      const [attempts, revisions] = await Promise.all([
        prisma.attempt.findMany({
          where: { userId: user.id, createdAt: { gte: since } },
          select: { createdAt: true },
        }),
        prisma.revision.findMany({
          where: { userId: user.id, nextDate: { lt: endOfToday } },
          select: {
            id: true,
            nextDate: true,
            lastRevised: true,
            repetitions: true,
            createdAt: true,
            problem: {
              select: {
                id: true,
                title: true,
                path: true,
                difficulty: true,
                pattern: true,
                platform: true,
              },
            },
          },
          orderBy: { nextDate: 'asc' },
        }),
      ]);

      const due = dedupeRevisionQueue(revisions);
      const activity = buildActivityCalendar(
        attempts.map((a) => a.createdAt),
        { days: STREAK_WINDOW_DAYS, today: now },
      );

      const risk = assessStreakRisk({ activity, dueCount: due.length, now });

      if (!risk.atRisk || !user.email) {
        report.push({
          user: user.email ?? user.id,
          sent: false,
          reason: risk.reason,
          streakDays: risk.streakDays,
          dueCount: due.length,
        });
        continue;
      }

      // Only link out to a question the judge actually has, so no reminder
      // carries a dead link.
      const listed: ReminderProblem[] = await Promise.all(
        due.slice(0, LISTED_PROBLEMS).map(async (revision) => {
          const slug = leetCodeSlugFor(revision.problem.path);
          const remote = await fetchLeetCodeProblem(slug);

          return {
            id: revision.problem.id,
            title: formatProblemTitle(revision.problem.title),
            difficulty: revision.problem.difficulty,
            pattern: revision.problem.pattern ? patternLabel(revision.problem.pattern) : null,
            externalUrl: remote ? `https://leetcode.com/problems/${remote.titleSlug}/` : null,
          };
        }),
      );

      const email = buildStreakReminderEmail({
        userName: user.name,
        streakDays: risk.streakDays,
        urgency: risk.urgency,
        problems: listed,
        dueCount: due.length,
        appUrl,
      });

      if (!dryRun) {
        await sendStreakReminder(user.email, email);
      }

      report.push({
        user: user.email,
        sent: !dryRun,
        reason: dryRun ? 'dry-run' : risk.reason,
        streakDays: risk.streakDays,
        dueCount: due.length,
      });
    }

    return NextResponse.json({
      checked: users.length,
      sent: report.filter((r) => r.sent).length,
      dryRun,
      report,
    });
  } catch (error) {
    console.error('Streak reminder failed:', error);
    return NextResponse.json({ error: 'Streak reminder failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
