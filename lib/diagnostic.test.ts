import { describe, expect, it } from 'vitest';
import { LADDER } from './pattern-ladder';
import {
  DECK_SIZE,
  blindfold,
  buildDeck,
  type DeckRequest,
  type RecognitionStat,
} from './diagnostic';

/** Deterministic picks, so a deck's contents are assertable. */
const firstChoice = () => 0;

function request(overrides: Partial<DeckRequest> = {}): DeckRequest {
  return {
    exclude: new Set<string>(),
    recognition: new Map<string, RecognitionStat>(),
    touchedRungIds: new Set<string>(),
    random: firstChoice,
    ...overrides,
  };
}

describe('buildDeck', () => {
  it('fills a deck of the requested size', () => {
    expect(buildDeck(request())).toHaveLength(DECK_SIZE);
  });

  it('never repeats a problem inside one deck', () => {
    const deck = buildDeck(request({ size: 20 }));
    expect(new Set(deck.map((i) => i.slug)).size).toBe(deck.length);
  });

  it('spans as many patterns as it has items', () => {
    const deck = buildDeck(request());
    expect(new Set(deck.map((i) => i.rungId)).size).toBe(deck.length);
  });

  it('excludes anything already solved or attempted', () => {
    const exclude = new Set(LADDER.flatMap((r) => r.problems.slice(0, 2).map((p) => p.slug)));
    const deck = buildDeck(request({ exclude }));
    expect(deck.filter((i) => exclude.has(i.slug))).toEqual([]);
  });

  it('draws only from started rungs once enough of them exist', () => {
    const touchedRungIds = new Set(LADDER.slice(0, 6).map((r) => r.id));
    const deck = buildDeck(request({ touchedRungIds }));
    expect(deck.every((i) => touchedRungIds.has(i.rungId))).toBe(true);
  });

  it('widens to the whole ladder rather than returning a short deck', () => {
    const deck = buildDeck(request({ touchedRungIds: new Set([LADDER[0].id]) }));
    expect(deck).toHaveLength(DECK_SIZE);
    expect(new Set(deck.map((i) => i.rungId)).size).toBeGreaterThan(1);
  });

  it('puts a pattern that has never been tested ahead of one being named right', () => {
    const strong = LADDER[0];
    const untested = LADDER[1];
    const recognition = new Map<string, RecognitionStat>([
      [strong.corePattern, { seen: 10, correct: 10 }],
    ]);
    const deck = buildDeck(request({ recognition, size: 1 }));
    expect(deck[0].rungId).toBe(untested.id);
  });

  it('puts the pattern being named wrong ahead of the one being named right', () => {
    const recognition = new Map<string, RecognitionStat>(
      LADDER.map((r) => [r.corePattern, { seen: 5, correct: 5 } as RecognitionStat]),
    );
    const weak = LADDER[7];
    recognition.set(weak.corePattern, { seen: 5, correct: 0 });
    const deck = buildDeck(request({ recognition, size: 1 }));
    expect(deck[0].rungId).toBe(weak.id);
  });

  it('returns an empty deck rather than repeating itself when everything is excluded', () => {
    const exclude = new Set(LADDER.flatMap((r) => r.problems.map((p) => p.slug)));
    expect(buildDeck(request({ exclude }))).toEqual([]);
  });
});

describe('blindfold', () => {
  it('strips the answer before the deck reaches the client', () => {
    const deck = buildDeck(request({ size: 3 }));
    const blind = blindfold(deck);
    expect(deck[0].pattern).toBeTruthy();
    for (const item of blind) {
      expect('pattern' in item).toBe(false);
      expect(item.slug).toBeTruthy();
    }
  });
});
