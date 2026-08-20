import { describe, expect, it } from 'vitest';
import { recallStrength, SEGMENTS } from './recall-strength';

describe('recallStrength', () => {
  it('gives a brand new card one segment', () => {
    const s = recallStrength({ intervalDays: 1, repetitions: 0, lapses: 0 });
    expect(s.filled).toBe(1);
    expect(s.tier).toBe('learning');
  });

  it('fills every segment at the mastery interval', () => {
    const s = recallStrength({ intervalDays: 30, repetitions: 6, lapses: 0 });
    expect(s.filled).toBe(SEGMENTS);
    expect(s.tier).toBe('mastered');
  });

  it('never exceeds the gauge on a very long interval', () => {
    expect(recallStrength({ intervalDays: 180, repetitions: 9, lapses: 0 }).filled).toBe(
      SEGMENTS,
    );
  });

  it('reads a card that keeps collapsing as struggling', () => {
    expect(recallStrength({ intervalDays: 1, repetitions: 0, lapses: 3 }).tier).toBe(
      'struggling',
    );
  });

  it('stops calling it struggling once the interval recovers', () => {
    expect(recallStrength({ intervalDays: 14, repetitions: 4, lapses: 3 }).tier).toBe(
      'holding',
    );
  });

  it('treats a repeated mid-ladder card as holding', () => {
    expect(recallStrength({ intervalDays: 7, repetitions: 2, lapses: 0 }).tier).toBe(
      'holding',
    );
  });

  it('grows monotonically with the interval', () => {
    const filled = [1, 3, 7, 14, 21, 30].map(
      (d) => recallStrength({ intervalDays: d, repetitions: 3, lapses: 0 }).filled,
    );
    expect(filled).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
