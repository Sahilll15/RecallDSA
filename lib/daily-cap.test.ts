import { describe, expect, it } from 'vitest';
import { spreadBacklog, startOfLocalDay, type CappableCard } from './daily-cap';

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date(Date.UTC(2026, 9, 2, 10, 0));
const TODAY = Date.UTC(2026, 9, 2);
const at = (days: number) => new Date(TODAY + days * DAY + 6 * 60 * 60 * 1000);

function card(id: string, day: number, overrides: Partial<CappableCard> = {}): CappableCard {
  return { id, nextDate: at(day), intervalDays: 1, lapses: 0, ...overrides };
}

const dayOf = (date: Date) => Math.floor((date.getTime() - TODAY) / DAY);

describe('spreadBacklog', () => {
  it('leaves a queue under the cap alone', () => {
    const cards = [card('a', 0), card('b', -2)];
    expect(spreadBacklog(cards, { now: NOW, cap: 3 })).toEqual([]);
  });

  it('keeps the cap due today and pushes the overflow into later days', () => {
    const cards = Array.from({ length: 10 }, (_, i) => card(`c${i}`, -i));
    const moves = spreadBacklog(cards, { now: NOW, cap: 3 });

    expect(moves).toHaveLength(7);
    const perDay = moves.reduce<Record<number, number>>((acc, m) => {
      const d = dayOf(m.nextDate);
      acc[d] = (acc[d] ?? 0) + 1;
      return acc;
    }, {});
    expect(perDay).toEqual({ 1: 3, 2: 3, 3: 1 });
  });

  it('empties today on a restart', () => {
    const cards = Array.from({ length: 33 }, (_, i) => card(`c${i}`, -i));
    const moves = spreadBacklog(cards, { now: NOW, cap: 6, keepToday: 0 });

    expect(moves).toHaveLength(33);
    expect(moves.every((m) => dayOf(m.nextDate) >= 1)).toBe(true);
    expect(Math.max(...moves.map((m) => dayOf(m.nextDate)))).toBe(6);
  });

  it('counts cards already scheduled ahead against each day', () => {
    const cards = [card('a', 0), card('b', 0), card('x', 1), card('y', 1)];
    const moves = spreadBacklog(cards, { now: NOW, cap: 2, keepToday: 0 });

    expect(moves.map((m) => dayOf(m.nextDate))).toEqual([2, 2]);
  });

  it('keeps the weakest cards today and gives them the earliest slots', () => {
    const cards = [
      card('steady', -5, { intervalDays: 14 }),
      card('lapsing', 0, { lapses: 2 }),
      card('fresh', -1, { intervalDays: 1 }),
    ];
    const moves = spreadBacklog(cards, { now: NOW, cap: 1 });

    expect(moves.map((m) => m.id)).toEqual(['fresh', 'steady']);
    expect(dayOf(moves[0].nextDate)).toBe(1);
    expect(dayOf(moves[1].nextDate)).toBe(2);
  });
});

describe('startOfLocalDay', () => {
  it('uses the viewer offset, not UTC', () => {
    // 20:00 UTC on 2 Oct is already 3 Oct in India (offset -330).
    const late = new Date(Date.UTC(2026, 9, 2, 20, 0));
    expect(startOfLocalDay(late, -330).toISOString()).toBe('2026-10-02T18:30:00.000Z');
    expect(startOfLocalDay(late, 0).toISOString()).toBe('2026-10-02T00:00:00.000Z');
  });
});
