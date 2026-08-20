import type { ActivityCalendar } from './activity';

export type ReminderUrgency = 'nudge' | 'warning' | 'final';

export interface StreakRisk {
  atRisk: boolean;
  streakDays: number;
  urgency: ReminderUrgency;
  reason:
    | 'streak-at-risk'
    | 'already-reviewed-today'
    | 'no-streak-to-lose'
    | 'nothing-due';
}

export interface ReminderProblem {
  id: string;
  title: string;
  difficulty?: string | null;
  pattern?: string | null;
  /** Direct link to the problem on the judge, when we know the slug. */
  externalUrl?: string | null;
}

/** Hour of the local day at which the tone escalates. */
const WARNING_HOUR = 16;
const FINAL_HOUR = 20;

function urgencyFor(hour: number): ReminderUrgency {
  if (hour >= FINAL_HOUR) return 'final';
  if (hour >= WARNING_HOUR) return 'warning';
  return 'nudge';
}

/**
 * A streak is at risk when it is still alive, nothing has been reviewed today,
 * and there is something to review. Any of those missing means there is nothing
 * worth interrupting someone for.
 */
export function assessStreakRisk({
  activity,
  dueCount,
  now = new Date(),
}: {
  activity: Pick<ActivityCalendar, 'days' | 'currentStreak'>;
  dueCount: number;
  now?: Date;
}): StreakRisk {
  const today = activity.days[activity.days.length - 1];
  const reviewedToday = (today?.count ?? 0) > 0;
  const urgency = urgencyFor(now.getHours());

  if (reviewedToday) {
    return {
      atRisk: false,
      streakDays: activity.currentStreak,
      urgency,
      reason: 'already-reviewed-today',
    };
  }

  if (activity.currentStreak === 0) {
    return { atRisk: false, streakDays: 0, urgency, reason: 'no-streak-to-lose' };
  }

  if (dueCount === 0) {
    return {
      atRisk: false,
      streakDays: activity.currentStreak,
      urgency,
      reason: 'nothing-due',
    };
  }

  return {
    atRisk: true,
    streakDays: activity.currentStreak,
    urgency,
    reason: 'streak-at-risk',
  };
}

/** Titles come from file paths, so they are escaped rather than trusted. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const HEADLINE: Record<ReminderUrgency, (days: number) => string> = {
  nudge: (d) => `Your ${d}-day streak needs one review today`,
  warning: (d) => `${d}-day streak: still nothing reviewed today`,
  final: (d) => `Last call to keep your ${d}-day streak`,
};

/** Written lowercase because it is spoken after "Hi <name>,". */
const OPENING: Record<ReminderUrgency, (days: number) => string> = {
  nudge: (d) =>
    `you are ${d} ${d === 1 ? 'day' : 'days'} into a streak and today is still empty. One review keeps it going.`,
  warning: (d) =>
    `nothing has been reviewed yet today, and a ${d}-day streak is on the line. A single problem is enough to hold it.`,
  final: (d) =>
    `the day is nearly over and your ${d}-day streak has not been touched. One review, and it survives.`,
};

export interface ReminderEmail {
  subject: string;
  html: string;
  text: string;
}

export function buildStreakReminderEmail({
  userName,
  streakDays,
  urgency,
  problems,
  dueCount,
  appUrl,
}: {
  userName: string | null;
  streakDays: number;
  urgency: ReminderUrgency;
  problems: ReminderProblem[];
  dueCount: number;
  appUrl: string;
}): ReminderEmail {
  const name = userName?.trim() ? escapeHtml(userName.trim().split(' ')[0]) : 'there';
  const recallUrl = `${appUrl}/revision/recall`;
  const extra = dueCount - problems.length;

  const rows = problems
    .map((p) => {
      const meta = [p.pattern, p.difficulty]
        .filter((v): v is string => typeof v === 'string' && v.length > 0)
        .map(escapeHtml)
        .join(' &middot; ');
      const external = p.externalUrl
        ? `<a href="${escapeHtml(p.externalUrl)}" style="color:#64748b;text-decoration:none;font-size:13px;">Read the question &rarr;</a>`
        : '';

      return `<tr>
  <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;">
    <a href="${appUrl}/problems/${encodeURIComponent(p.id)}" style="color:#15803d;text-decoration:none;font-weight:600;font-size:15px;">${escapeHtml(p.title)}</a>
    ${meta ? `<div style="color:#64748b;font-size:13px;margin-top:2px;">${meta}</div>` : ''}
    ${external ? `<div style="margin-top:4px;">${external}</div>` : ''}
  </td>
</tr>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px 12px;background:#eff1f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #d7dbe3;border-radius:10px;overflow:hidden;">
    <tr>
      <td style="padding:22px 26px;background:#0a0d12;">
        <span style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:15px;font-weight:600;color:#ffffff;">recalldsa<span style="color:#2fd07a;">_</span></span>
      </td>
    </tr>
    <tr>
      <td style="padding:26px;">
        <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#64748b;">Streak at risk</div>
        <h1 style="margin:8px 0 0;font-size:21px;line-height:1.3;color:#0f172a;">${escapeHtml(HEADLINE[urgency](streakDays))}</h1>

        <p style="font-size:15px;line-height:1.6;margin:14px 0 0;">Hi ${name}, ${escapeHtml(OPENING[urgency](streakDays))}</p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid #d7dbe3;border-radius:8px;">
          <tr>
            <td style="padding:14px 16px;text-align:center;border-right:1px solid #d7dbe3;">
              <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#64748b;">Streak</div>
              <div style="font-size:24px;font-weight:700;color:#15803d;">${streakDays}</div>
            </td>
            <td style="padding:14px 16px;text-align:center;">
              <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#64748b;">Due now</div>
              <div style="font-size:24px;font-weight:700;color:#b91c1c;">${dueCount}</div>
            </td>
          </tr>
        </table>

        <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#64748b;margin-bottom:4px;">Waiting for you</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
        ${extra > 0 ? `<p style="font-size:13px;color:#64748b;margin:12px 0 0;">and ${extra} more in the queue.</p>` : ''}

        <div style="text-align:center;margin:26px 0 6px;">
          <a href="${recallUrl}" style="display:inline-block;background:#15803d;color:#ffffff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Start a recall session</a>
        </div>

        <p style="font-size:13px;line-height:1.6;color:#64748b;margin:22px 0 0;padding-top:16px;border-top:1px solid #e2e8f0;">
          Name the pattern first, reconstruct the approach, and only then look. That is the part that sticks.
        </p>
      </td>
    </tr>
  </table>
  <p style="max-width:560px;margin:14px auto 0;text-align:center;font-size:12px;color:#94a3b8;">
    <a href="${appUrl}/settings" style="color:#94a3b8;">Reminder settings</a>
  </p>
</body>
</html>`;

  const text = [
    HEADLINE[urgency](streakDays),
    '',
    `Hi ${userName?.trim()?.split(' ')[0] ?? 'there'}, ${OPENING[urgency](streakDays)}`,
    '',
    `Streak: ${streakDays} days. Due now: ${dueCount}.`,
    '',
    ...problems.map((p) =>
      `- ${p.title}${p.externalUrl ? ` (${p.externalUrl})` : ''}\n  ${appUrl}/problems/${p.id}`,
    ),
    extra > 0 ? `\nand ${extra} more in the queue.` : '',
    '',
    `Start a recall session: ${recallUrl}`,
  ]
    .filter((line) => line !== undefined)
    .join('\n');

  return {
    subject: HEADLINE[urgency](streakDays),
    html,
    text,
  };
}
