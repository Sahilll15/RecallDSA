export interface ActivityDay {
  date: string;
  count: number;
  /** 0 for nothing, then four bands so the calendar reads at a glance. */
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ActivityCalendar {
  days: ActivityDay[];
  total: number;
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
  busiest: number;
}

/** Local calendar day, so a late-night review counts as that evening. */
export function dayKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function levelFor(count: number): ActivityDay['level'] {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

/**
 * Builds a contiguous run of days ending today. Gaps matter as much as hits, so
 * every day in the window is present even when nothing happened.
 */
export function buildActivityCalendar(
  timestamps: Array<Date | string>,
  { days = 364, today = new Date() }: { days?: number; today?: Date } = {},
): ActivityCalendar {
  const counts = new Map<string, number>();

  for (const stamp of timestamps) {
    const key = dayKey(stamp instanceof Date ? stamp : new Date(stamp));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const series: ActivityDay[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(end);
    date.setDate(date.getDate() - i);
    const key = dayKey(date);
    const count = counts.get(key) ?? 0;
    series.push({ date: key, count, level: levelFor(count) });
  }

  let longestStreak = 0;
  let running = 0;
  for (const day of series) {
    running = day.count > 0 ? running + 1 : 0;
    if (running > longestStreak) longestStreak = running;
  }

  // A quiet today does not end a streak: the day is not over yet.
  let currentStreak = 0;
  const startIndex =
    series.length > 0 && series[series.length - 1].count === 0
      ? series.length - 2
      : series.length - 1;
  for (let i = startIndex; i >= 0; i--) {
    if (series[i].count === 0) break;
    currentStreak++;
  }

  return {
    days: series,
    total: series.reduce((sum, d) => sum + d.count, 0),
    activeDays: series.filter((d) => d.count > 0).length,
    currentStreak,
    longestStreak,
    busiest: series.reduce((max, d) => Math.max(max, d.count), 0),
  };
}
