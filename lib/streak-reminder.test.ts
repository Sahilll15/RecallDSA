import { describe, expect, it } from 'vitest';
import { buildActivityCalendar } from './activity';
import {
  assessStreakRisk,
  buildStreakReminderEmail,
  escapeHtml,
  type ReminderProblem,
} from './streak-reminder';

const at = (iso: string) => new Date(iso);
const today = new Date(2026, 7, 20, 18, 0, 0);

const calendarFor = (stamps: Date[]) =>
  buildActivityCalendar(stamps, { days: 30, today });

describe('assessStreakRisk', () => {
  it('flags a live streak with nothing reviewed today and work waiting', () => {
    const risk = assessStreakRisk({
      activity: calendarFor([at('2026-08-18T10:00:00'), at('2026-08-19T10:00:00')]),
      dueCount: 4,
      now: today,
    });

    expect(risk.atRisk).toBe(true);
    expect(risk.streakDays).toBe(2);
    expect(risk.reason).toBe('streak-at-risk');
  });

  it('stays quiet once something has been reviewed today', () => {
    const risk = assessStreakRisk({
      activity: calendarFor([at('2026-08-19T10:00:00'), at('2026-08-20T09:00:00')]),
      dueCount: 4,
      now: today,
    });

    expect(risk.atRisk).toBe(false);
    expect(risk.reason).toBe('already-reviewed-today');
  });

  it('stays quiet when there is no streak to lose', () => {
    const risk = assessStreakRisk({
      activity: calendarFor([at('2026-08-10T10:00:00')]),
      dueCount: 9,
      now: today,
    });

    expect(risk.atRisk).toBe(false);
    expect(risk.reason).toBe('no-streak-to-lose');
  });

  it('stays quiet when the queue is empty, since there is nothing to ask for', () => {
    const risk = assessStreakRisk({
      activity: calendarFor([at('2026-08-19T10:00:00')]),
      dueCount: 0,
      now: today,
    });

    expect(risk.atRisk).toBe(false);
    expect(risk.reason).toBe('nothing-due');
  });

  it('escalates the tone as the day runs out', () => {
    const activity = calendarFor([at('2026-08-19T10:00:00')]);
    const urgencyAt = (hour: number) =>
      assessStreakRisk({
        activity,
        dueCount: 1,
        now: new Date(2026, 7, 20, hour, 0, 0),
      }).urgency;

    expect(urgencyAt(9)).toBe('nudge');
    expect(urgencyAt(17)).toBe('warning');
    expect(urgencyAt(22)).toBe('final');
  });
});

describe('buildStreakReminderEmail', () => {
  const problems: ReminderProblem[] = [
    {
      id: 'abc123',
      title: 'Split Array Largest Sum',
      difficulty: 'hard',
      pattern: 'Binary Search on Answer',
      externalUrl: 'https://leetcode.com/problems/split-array-largest-sum/',
    },
    { id: 'def456', title: 'Permutations II', difficulty: 'medium', pattern: null },
  ];

  const build = (overrides = {}) =>
    buildStreakReminderEmail({
      userName: 'Sahil Chalke',
      streakDays: 6,
      urgency: 'warning',
      problems,
      dueCount: 5,
      appUrl: 'https://recall-dsa.vercel.app',
      ...overrides,
    });

  it('links every problem to its page in the app', () => {
    const { html } = build();
    expect(html).toContain('https://recall-dsa.vercel.app/problems/abc123');
    expect(html).toContain('https://recall-dsa.vercel.app/problems/def456');
  });

  it('links out to the question on the judge when the slug is known', () => {
    const { html } = build();
    expect(html).toContain('https://leetcode.com/problems/split-array-largest-sum/');
  });

  it('omits the outbound link when there is no slug', () => {
    const { html } = build({ problems: [{ id: 'x', title: 'Mystery', externalUrl: null }] });
    expect(html).not.toContain('Read the question');
  });

  it('points the call to action at a recall session', () => {
    expect(build().html).toContain('https://recall-dsa.vercel.app/revision/recall');
  });

  it('names the streak length in the subject', () => {
    expect(build().subject).toContain('6');
  });

  it('changes the subject with the urgency', () => {
    expect(build({ urgency: 'nudge' }).subject).not.toBe(build({ urgency: 'final' }).subject);
  });

  it('greets by first name and falls back politely', () => {
    expect(build().html).toContain('Hi Sahil,');
    expect(build({ userName: null }).html).toContain('Hi there,');
  });

  it('says how many more are waiting beyond the listed ones', () => {
    expect(build({ dueCount: 5 }).html).toContain('3 more in the queue');
  });

  it('does not claim extras when the list is complete', () => {
    expect(build({ dueCount: 2 }).html).not.toContain('more in the queue');
  });

  it('ships a plain text alternative carrying the same links', () => {
    const { text } = build();
    expect(text).toContain('https://recall-dsa.vercel.app/problems/abc123');
    expect(text).toContain('https://leetcode.com/problems/split-array-largest-sum/');
    expect(text).toContain('https://recall-dsa.vercel.app/revision/recall');
  });

  it('escapes a title that would otherwise break the markup', () => {
    const { html } = build({
      problems: [{ id: 'x', title: '<img src=x onerror=alert(1)>', externalUrl: null }],
    });
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x');
  });

  it('encodes the id into the url rather than interpolating it raw', () => {
    const { html } = build({ problems: [{ id: 'a b/c', title: 'T', externalUrl: null }] });
    expect(html).toContain('/problems/a%20b%2Fc');
  });
});

describe('escapeHtml', () => {
  it('escapes every character that changes markup meaning', () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
  });
});
