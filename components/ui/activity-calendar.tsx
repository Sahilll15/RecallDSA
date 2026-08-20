'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { ActivityDay } from '@/lib/activity';

const LEVEL_FILL = [
  'bg-calendar-empty',
  'bg-primary/25',
  'bg-primary/45',
  'bg-primary/70',
  'bg-primary',
] as const;

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Parsed as local noon so a timezone shift cannot move a square a day. */
function parseDay(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

function label(day: ActivityDay): string {
  const date = parseDay(day.date);
  const when = `${MONTHS[date.getMonth()]} ${date.getDate()}`;
  if (day.count === 0) return `No reviews on ${when}`;
  return `${day.count} ${day.count === 1 ? 'review' : 'reviews'} on ${when}`;
}

/**
 * Consistency as a year of squares, columns being weeks. Recall is a habit, and
 * a habit is easier to read as a run of days than as an average.
 */
export function ActivityCalendar({
  days,
  className,
}: {
  days: ActivityDay[];
  className?: string;
}) {
  const { weeks, months } = useMemo(() => {
    if (days.length === 0) return { weeks: [], months: [] };

    // Pad so every column is a full Sunday-to-Saturday week.
    const lead = parseDay(days[0].date).getDay();
    const cells: Array<ActivityDay | null> = [...Array(lead).fill(null), ...days];
    while (cells.length % 7 !== 0) cells.push(null);

    const grouped: Array<Array<ActivityDay | null>> = [];
    for (let i = 0; i < cells.length; i += 7) grouped.push(cells.slice(i, i + 7));

    const labels: Array<{ index: number; name: string }> = [];
    let lastMonth = -1;
    grouped.forEach((week, index) => {
      const first = week.find(Boolean);
      if (!first) return;
      const month = parseDay(first.date).getMonth();
      if (month !== lastMonth) {
        labels.push({ index, name: MONTHS[month] });
        lastMonth = month;
      }
    });

    return { weeks: grouped, months: labels };
  }, [days]);

  if (weeks.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="overflow-x-auto pb-1">
        <div className="inline-block min-w-full">
          <div className="mb-1 flex gap-[3px]">
            {weeks.map((_, index) => {
              const month = months.find((m) => m.index === index);
              return (
                <span
                  key={index}
                  className="w-[11px] shrink-0 font-mono text-[0.625rem] text-muted-foreground"
                >
                  {month ? month.name : ''}
                </span>
              );
            })}
          </div>

          <div className="flex gap-[3px]">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[3px]">
                {week.map((day, dayIndex) =>
                  day ? (
                    <span
                      key={day.date}
                      aria-label={label(day)}
                      className={cn(
                        'group/cell relative h-[11px] w-[11px] rounded-[2px]',
                        LEVEL_FILL[day.level],
                      )}
                    >
                      <span
                        className={cn(
                          // The row sits in a horizontally-scrolling box, which clips
                          // vertical overflow too — flip below for the top rows so the
                          // tooltip stays inside the box instead of getting cut off.
                          'pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 font-mono text-[0.625rem] text-popover-foreground opacity-0 shadow-md transition-opacity group-hover/cell:opacity-100',
                          dayIndex < 2 ? 'top-[calc(100%+6px)]' : 'bottom-[calc(100%+6px)]',
                        )}
                      >
                        {label(day)}
                      </span>
                    </span>
                  ) : (
                    <span key={`pad-${weekIndex}-${dayIndex}`} className="h-[11px] w-[11px]" />
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5">
        <span className="font-mono text-[0.625rem] text-muted-foreground">less</span>
        {LEVEL_FILL.map((fill, i) => (
          <span key={i} className={cn('h-[11px] w-[11px] rounded-[2px]', fill)} />
        ))}
        <span className="font-mono text-[0.625rem] text-muted-foreground">more</span>
      </div>
    </div>
  );
}
