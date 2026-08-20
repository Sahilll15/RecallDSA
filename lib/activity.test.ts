import { describe, expect, it } from 'vitest';
import { buildActivityCalendar, dayKey } from './activity';

const at = (iso: string) => new Date(iso);

describe('buildActivityCalendar', () => {
  const today = new Date(2026, 7, 20, 12, 0, 0);

  it('returns one entry per day in the window, gaps included', () => {
    const cal = buildActivityCalendar([], { days: 7, today });
    expect(cal.days).toHaveLength(7);
    expect(cal.days.every((d) => d.count === 0 && d.level === 0)).toBe(true);
    expect(cal.total).toBe(0);
  });

  it('ends on today', () => {
    const cal = buildActivityCalendar([], { days: 5, today });
    expect(cal.days[cal.days.length - 1].date).toBe('2026-08-20');
    expect(cal.days[0].date).toBe('2026-08-16');
  });

  it('counts several reviews on one day into that day', () => {
    const cal = buildActivityCalendar(
      [at('2026-08-19T09:00:00'), at('2026-08-19T21:30:00'), at('2026-08-19T23:59:00')],
      { days: 5, today },
    );
    const day = cal.days.find((d) => d.date === '2026-08-19');
    expect(day?.count).toBe(3);
    expect(cal.total).toBe(3);
    expect(cal.activeDays).toBe(1);
  });

  it('bands the levels by volume', () => {
    const many = (n: number, iso: string) => Array.from({ length: n }, () => at(iso));
    const cal = buildActivityCalendar(
      [
        ...many(1, '2026-08-16T10:00:00'),
        ...many(4, '2026-08-17T10:00:00'),
        ...many(7, '2026-08-18T10:00:00'),
        ...many(14, '2026-08-19T10:00:00'),
      ],
      { days: 5, today },
    );
    const level = (d: string) => cal.days.find((x) => x.date === d)?.level;
    expect(level('2026-08-16')).toBe(1);
    expect(level('2026-08-17')).toBe(2);
    expect(level('2026-08-18')).toBe(3);
    expect(level('2026-08-19')).toBe(4);
    expect(cal.busiest).toBe(14);
  });

  it('counts a streak running up to today', () => {
    const cal = buildActivityCalendar(
      [at('2026-08-18T10:00:00'), at('2026-08-19T10:00:00'), at('2026-08-20T10:00:00')],
      { days: 10, today },
    );
    expect(cal.currentStreak).toBe(3);
    expect(cal.longestStreak).toBe(3);
  });

  it('keeps the streak alive when today has not happened yet', () => {
    const cal = buildActivityCalendar(
      [at('2026-08-18T10:00:00'), at('2026-08-19T10:00:00')],
      { days: 10, today },
    );
    expect(cal.currentStreak).toBe(2);
  });

  it('breaks the streak on a missed day', () => {
    const cal = buildActivityCalendar(
      [at('2026-08-15T10:00:00'), at('2026-08-16T10:00:00'), at('2026-08-19T10:00:00')],
      { days: 10, today },
    );
    expect(cal.currentStreak).toBe(1);
    expect(cal.longestStreak).toBe(2);
  });

  it('reports no current streak when the last two days are empty', () => {
    const cal = buildActivityCalendar([at('2026-08-17T10:00:00')], { days: 10, today });
    expect(cal.currentStreak).toBe(0);
  });

  it('ignores reviews older than the window', () => {
    const cal = buildActivityCalendar([at('2020-01-01T10:00:00')], { days: 5, today });
    expect(cal.total).toBe(0);
  });
});

describe('dayKey', () => {
  it('formats a local calendar day', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });
});
