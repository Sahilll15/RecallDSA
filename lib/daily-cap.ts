/**
 * Keeps any one day's review load small enough to actually finish. A backlog
 * (missed days, a big sync, a backfill of old solves) is not dropped: the
 * overflow is pushed into the nearest days that still have room.
 */

export const DAILY_REVIEW_CAP = 6;

const DAY = 24 * 60 * 60 * 1000;
// Mid-day, so a card lands on the same calendar date in every nearby time zone.
const SLOT_OFFSET = 12 * 60 * 60 * 1000;

export interface CappableCard {
  id: string;
  nextDate: Date;
  intervalDays: number;
  lapses: number;
}

export interface SpreadOptions {
  now?: Date;
  cap?: number;
  /** How many due cards stay due today. 0 empties today entirely. */
  keepToday?: number;
  /** `Date#getTimezoneOffset()` of the viewer, so "today" means their today. */
  tzOffsetMinutes?: number;
}

export interface Move {
  id: string;
  nextDate: Date;
}

/** Start of the viewer's local day, as a UTC instant. */
export function startOfLocalDay(now: Date, tzOffsetMinutes = 0): Date {
  const shift = tzOffsetMinutes * 60 * 1000;
  const local = now.getTime() - shift;
  return new Date(local - (((local % DAY) + DAY) % DAY) + shift);
}

/** Weakest first: cards that keep lapsing, then short intervals, then the most overdue. */
function byPriority(a: CappableCard, b: CappableCard): number {
  if (a.lapses !== b.lapses) return b.lapses - a.lapses;
  if (a.intervalDays !== b.intervalDays) return a.intervalDays - b.intervalDays;
  return a.nextDate.getTime() - b.nextDate.getTime();
}

export function spreadBacklog(cards: CappableCard[], options: SpreadOptions = {}): Move[] {
  const now = options.now ?? new Date();
  const cap = Math.max(1, options.cap ?? DAILY_REVIEW_CAP);
  const keepToday = Math.max(0, Math.min(cap, options.keepToday ?? cap));
  const today = startOfLocalDay(now, options.tzOffsetMinutes).getTime();

  const dayOf = (date: Date) => Math.floor((date.getTime() - today) / DAY);

  const due = cards.filter((c) => dayOf(c.nextDate) <= 0).sort(byPriority);
  if (due.length <= keepToday) return [];

  const load = new Map<number, number>();
  for (const card of cards) {
    const day = dayOf(card.nextDate);
    if (day > 0) load.set(day, (load.get(day) ?? 0) + 1);
  }

  const moves: Move[] = [];
  let day = 1;
  for (const card of due.slice(keepToday)) {
    while ((load.get(day) ?? 0) >= cap) day++;
    load.set(day, (load.get(day) ?? 0) + 1);
    moves.push({ id: card.id, nextDate: new Date(today + day * DAY + SLOT_OFFSET) });
  }

  return moves;
}
