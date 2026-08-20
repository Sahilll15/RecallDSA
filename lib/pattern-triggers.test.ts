import { describe, expect, it } from 'vitest';
import { PATTERN_TRIGGERS, drillOrder, triggerFor } from './pattern-triggers';
import { PATTERNS } from './constants';

describe('PATTERN_TRIGGERS', () => {
  it('names a pattern the app actually uses', () => {
    const known = new Set(PATTERNS.map((p) => p.value));
    for (const trigger of PATTERN_TRIGGERS) {
      expect(known, `${trigger.pattern} is not in PATTERNS`).toContain(trigger.pattern);
    }
  });

  it('holds one card per pattern, never two', () => {
    const seen = new Set(PATTERN_TRIGGERS.map((t) => t.pattern));
    expect(seen.size).toBe(PATTERN_TRIGGERS.length);
  });

  it('stays inside the few-minutes-a-day budget the method calls for', () => {
    expect(PATTERN_TRIGGERS.length).toBeGreaterThanOrEqual(15);
    expect(PATTERN_TRIGGERS.length).toBeLessThanOrEqual(30);
  });

  it('describes features and a mechanism on every card', () => {
    for (const trigger of PATTERN_TRIGGERS) {
      expect(trigger.features.length).toBeGreaterThan(40);
      expect(trigger.mechanism.length).toBeGreaterThan(20);
    }
  });

  it('never leaks the pattern name into its own prompt', () => {
    for (const trigger of PATTERN_TRIGGERS) {
      const words = trigger.pattern.split('-').filter((w) => w.length > 4);
      const features = trigger.features.toLowerCase();
      for (const word of words) {
        expect(features, `${trigger.pattern} gives itself away`).not.toContain(word);
      }
    }
  });

  it('finds a card by pattern', () => {
    expect(triggerFor('sliding-window')?.pattern).toBe('sliding-window');
    expect(triggerFor('not-a-pattern')).toBeUndefined();
  });
});

describe('drillOrder', () => {
  const deck = [
    { pattern: 'a', features: 'x', mechanism: 'y' },
    { pattern: 'b', features: 'x', mechanism: 'y' },
    { pattern: 'c', features: 'x', mechanism: 'y' },
  ];

  it('puts the pattern with the worst struggle rate first', () => {
    const order = drillOrder(
      deck,
      new Map([
        ['a', { attempts: 4, struggles: 0 }],
        ['b', { attempts: 4, struggles: 4 }],
        ['c', { attempts: 4, struggles: 2 }],
      ]),
    );

    expect(order.map((t) => t.pattern)).toEqual(['b', 'c', 'a']);
  });

  it('keeps a barely-tested pattern out of both extremes', () => {
    const order = drillOrder(
      deck,
      new Map([
        ['a', { attempts: 5, struggles: 5 }],
        ['b', { attempts: 1, struggles: 1 }],
        ['c', { attempts: 5, struggles: 0 }],
      ]),
    );

    expect(order.map((t) => t.pattern)).toEqual(['a', 'b', 'c']);
  });

  it('leaves the deck intact when nothing has been attempted', () => {
    expect(drillOrder(deck, new Map()).map((t) => t.pattern)).toEqual(['a', 'b', 'c']);
  });

  it('does not mutate the deck it was given', () => {
    const original = [...deck];
    drillOrder(deck, new Map([['c', { attempts: 3, struggles: 3 }]]));
    expect(deck).toEqual(original);
  });
});
