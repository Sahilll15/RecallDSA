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

  // Email-safe difficulty colors: a fixed hex triple, not the app's CSS
  // variables, since a mail client never loads the app's stylesheet.
  const DIFFICULTY_COLOR: Record<string, string> = {
    easy: '#25c178',
    medium: '#f9af2f',
    hard: '#e85454',
  };

  const rows = problems
    .map((p, i) => {
      const difficultyColor = p.difficulty ? DIFFICULTY_COLOR[p.difficulty.toLowerCase()] : null;
      const isLast = i === problems.length - 1;

      const DIFFICULTY_SOFT: Record<string, string> = {
        easy: '#123022',
        medium: '#362712',
        hard: '#371515',
      };
      const softBg = p.difficulty ? DIFFICULTY_SOFT[p.difficulty.toLowerCase()] : null;

      const tags = [
        p.difficulty && difficultyColor && softBg
          ? `<span style="display:inline-block;padding:2px 8px;border-radius:4px;background:${softBg};color:${difficultyColor};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;">${escapeHtml(p.difficulty)}</span>`
          : '',
        p.pattern
          ? `<span style="display:inline-block;padding:2px 8px;border-radius:4px;border:1px solid #23272f;color:#969eab;font-family:ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace;font-size:11px;">${escapeHtml(p.pattern)}</span>`
          : '',
      ]
        .filter(Boolean)
        .join('&nbsp;&nbsp;');

      const external = p.externalUrl
        ? `<a href="${escapeHtml(p.externalUrl)}" style="color:#969eab;text-decoration:none;font-size:13px;">Read the question&nbsp;&rarr;</a>`
        : '';

      return `<tr>
  <td style="padding:14px 0;${isLast ? '' : 'border-bottom:1px solid #23272f;'}">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="vertical-align:top;">
          <a href="${appUrl}/problems/${encodeURIComponent(p.id)}" style="color:#f3f5f7;text-decoration:none;font-weight:600;font-size:15px;line-height:1.4;">${escapeHtml(p.title)}</a>
          ${tags ? `<div style="margin-top:6px;">${tags}</div>` : ''}
          ${external ? `<div style="margin-top:6px;">${external}</div>` : ''}
        </td>
      </tr>
    </table>
  </td>
</tr>`;
    })
    .join('');

  const preheader = `${HEADLINE[urgency](streakDays)} — ${dueCount} due, ${streakDays}-day streak.`;

  // Urgency reads as a status strip before any text is parsed, the way a CI
  // run signals pass/fail before you read the log — familiar to the audience.
  const URGENCY_COLOR: Record<ReminderUrgency, string> = {
    nudge: '#25c178',
    warning: '#f9af2f',
    final: '#e85454',
  };
  const stripColor = URGENCY_COLOR[urgency];

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${escapeHtml(HEADLINE[urgency](streakDays))}</title>
<!--[if mso]>
<style>table,td,div,h1,p,a{font-family:Arial,sans-serif !important;}</style>
<![endif]-->
</head>
<body style="margin:0;padding:0;background:#0a0c10;">
  <!-- Preview text: shows next to the subject in the inbox list, hidden in the body. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
    ${escapeHtml(preheader)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0c10;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0e1015;border:1px solid #23272f;border-radius:10px;">
          <tr>
            <td style="height:4px;line-height:4px;font-size:0;background:${stripColor};border-radius:10px 10px 0 0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:18px 26px;background:#0a0c10;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace;font-size:15px;font-weight:600;color:#ffffff;">recalldsa<span style="color:#2fd07a;">_</span></td>
                  <td align="right" style="font-family:ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${stripColor};">&#9679;&nbsp;${urgency}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 26px 26px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f3f5f7;">

              <p style="margin:0;font-family:ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#969eab;">Streak at risk</p>
              <h1 style="margin:8px 0 0;font-size:21px;line-height:1.35;color:#f3f5f7;font-weight:700;">${escapeHtml(HEADLINE[urgency](streakDays))}</h1>
              <p style="font-size:15px;line-height:1.6;margin:14px 0 0;color:#f3f5f7;">Hi ${name}, ${escapeHtml(OPENING[urgency](streakDays))}</p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;border:1px solid #23272f;border-radius:8px;background:#15181e;">
                <tr>
                  <td width="50%" style="padding:16px;text-align:center;border-right:1px solid #23272f;">
                    <div style="font-family:ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#969eab;">Streak</div>
                    <div style="font-family:ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace;font-size:26px;font-weight:700;color:#25c178;line-height:1.4;">${streakDays}<span style="font-size:13px;font-weight:500;color:#969eab;">&nbsp;${streakDays === 1 ? 'day' : 'days'}</span></div>
                  </td>
                  <td width="50%" style="padding:16px;text-align:center;">
                    <div style="font-family:ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#969eab;">Due now</div>
                    <div style="font-family:ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace;font-size:26px;font-weight:700;color:#e85454;line-height:1.4;">${dueCount}</div>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 4px;font-family:ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#969eab;">Waiting for you</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
              ${extra > 0 ? `<p style="font-size:13px;color:#969eab;margin:12px 0 0;">and ${extra} more in the queue.</p>` : ''}

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 6px;">
                <tr>
                  <td align="center" style="border-radius:8px;background:#25c178;">
                    <a href="${recallUrl}" style="display:inline-block;padding:14px 30px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#0b0d14;text-decoration:none;border-radius:8px;">Start a recall session</a>
                  </td>
                </tr>
              </table>

              <p style="font-size:13px;line-height:1.6;color:#969eab;margin:24px 0 0;padding-top:18px;border-top:1px solid #23272f;">
                Name the pattern first, reconstruct the approach, and only then look. That is the part that sticks.
              </p>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td align="center" style="padding:16px 12px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#969eab;line-height:1.6;">
              You are getting this because a streak on recalldsa is about to lapse.<br>
              <a href="${appUrl}/settings" style="color:#969eab;">Reminder settings</a>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
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
