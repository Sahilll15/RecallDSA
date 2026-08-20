import { describe, expect, it } from 'vitest';
import {
  FIRST_INTERVAL_DAYS,
  MASTERY_INTERVAL_DAYS,
  MAX_INTERVAL_DAYS,
  MIN_EASE,
  initialSchedulingState,
  nextDateFrom,
  previewIntervals,
  scheduleNext,
  type SchedulingState,
} from './spaced-repetition';

const fresh = (): SchedulingState => initialSchedulingState();

describe('scheduleNext', () => {
  it('walks the 1 -> 3 -> 7 -> 14 -> 30 ladder on consecutive "good" ratings', () => {
    let state = fresh();
    for (const expected of [3, 7, 14, 30]) {
      state = scheduleNext(state, 'good');
      expect(state.intervalDays).toBe(expected);
    }
  });

  it('reaches the mastery interval by walking the ladder, not by compounding', () => {
    let state = fresh();
    for (let i = 0; i < 4; i++) state = scheduleNext(state, 'good');
    expect(state.intervalDays).toBe(MASTERY_INTERVAL_DAYS);
  });

  it('grows by the ease factor once the ladder runs out', () => {
    let state = fresh();
    for (let i = 0; i < 4; i++) state = scheduleNext(state, 'good');
    const before = state;
    state = scheduleNext(state, 'good');
    expect(state.intervalDays).toBe(Math.round(before.intervalDays * before.easeFactor));
  });

  it('"again" resets the interval to 1 day, counts a lapse, and lowers ease', () => {
    let state = fresh();
    state = scheduleNext(state, 'good');
    state = scheduleNext(state, 'good');
    const easeBefore = state.easeFactor;
    state = scheduleNext(state, 'again');
    expect(state.intervalDays).toBe(1);
    expect(state.repetitions).toBe(0);
    expect(state.lapses).toBe(1);
    expect(state.easeFactor).toBeLessThan(easeBefore);
  });

  it('"hard" grows the interval slower than "good" and lowers ease', () => {
    const base: SchedulingState = { intervalDays: 10, easeFactor: 2.5, repetitions: 3, lapses: 0 };
    const hard = scheduleNext(base, 'hard');
    const good = scheduleNext(base, 'good');
    expect(hard.intervalDays).toBeGreaterThan(base.intervalDays);
    expect(hard.intervalDays).toBeLessThan(good.intervalDays);
    expect(hard.easeFactor).toBeLessThan(base.easeFactor);
  });

  it('"easy" grows faster than "good" and raises ease', () => {
    const base: SchedulingState = { intervalDays: 10, easeFactor: 2.5, repetitions: 3, lapses: 0 };
    const good = scheduleNext(base, 'good');
    const easy = scheduleNext(base, 'easy');
    expect(easy.intervalDays).toBeGreaterThan(good.intervalDays);
    expect(easy.easeFactor).toBeGreaterThan(base.easeFactor);
  });

  it('never drops ease below the floor or grows intervals past the cap', () => {
    let state: SchedulingState = { intervalDays: 170, easeFactor: 1.32, repetitions: 9, lapses: 4 };
    const lapsed = scheduleNext(state, 'again');
    expect(lapsed.easeFactor).toBeGreaterThanOrEqual(MIN_EASE);
    const grown = scheduleNext({ ...state, easeFactor: 2.8 }, 'easy');
    expect(grown.intervalDays).toBeLessThanOrEqual(MAX_INTERVAL_DAYS);
  });

  it('interval never goes below one day', () => {
    const state: SchedulingState = { intervalDays: 1, easeFactor: 1.3, repetitions: 1, lapses: 0 };
    expect(scheduleNext(state, 'hard').intervalDays).toBeGreaterThanOrEqual(1);
    expect(scheduleNext(state, 'again').intervalDays).toBe(1);
  });
});

describe('previewIntervals', () => {
  it('matches what scheduleNext would produce for each rating', () => {
    const state: SchedulingState = { intervalDays: 7, easeFactor: 2.5, repetitions: 2, lapses: 0 };
    const preview = previewIntervals(state);
    expect(preview.again).toBe(scheduleNext(state, 'again').intervalDays);
    expect(preview.hard).toBe(scheduleNext(state, 'hard').intervalDays);
    expect(preview.good).toBe(scheduleNext(state, 'good').intervalDays);
    expect(preview.easy).toBe(scheduleNext(state, 'easy').intervalDays);
  });
});

describe('nextDateFrom', () => {
  it('returns a date the given number of days ahead', () => {
    const from = new Date('2026-08-14T10:00:00Z');
    const next = nextDateFrom(3, from);
    expect(next.getTime() - from.getTime()).toBe(3 * 24 * 60 * 60 * 1000);
  });
});

describe('initialSchedulingState', () => {
  it('starts at the first interval with default ease', () => {
    const state = fresh();
    expect(state.intervalDays).toBe(FIRST_INTERVAL_DAYS);
    expect(state.easeFactor).toBe(2.5);
    expect(state.repetitions).toBe(0);
    expect(state.lapses).toBe(0);
  });
});
