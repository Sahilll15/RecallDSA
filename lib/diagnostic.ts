import { LADDER, type LadderDifficulty, type LadderRung } from './pattern-ladder';

/**
 * The blind diagnostic: real problem statements with the topic hidden.
 *
 * Every other surface in this app tells you the pattern before you think, by
 * putting the problem under a heading or pulling it out of a queue you built.
 * An interview does not. This deck is the only place recognition is measured on
 * a statement you have never seen, which is why a contaminated item is worse
 * than a missing one: anything already solved or already attempted is excluded.
 */

export const DECK_SIZE = 10;
/** Seconds per statement. Long enough to read it, short enough to force a call. */
export const ITEM_SECONDS = 60;

export interface DeckItem {
  slug: string;
  number: string;
  title: string;
  difficulty: LadderDifficulty;
  rungId: string;
  /** The answer. Never sent to the client before the guess is in. */
  pattern: string;
}

export interface RecognitionStat {
  /** Diagnostic items answered for this corePattern. */
  seen: number;
  correct: number;
}

export interface DeckRequest {
  /** Slugs to keep out: solved in the repo, or already attempted on the ladder. */
  exclude: Set<string>;
  /** Per-corePattern recognition history, for ordering. */
  recognition: Map<string, RecognitionStat>;
  /** Rungs the user has started. Empty means draw from the whole ladder. */
  touchedRungIds: Set<string>;
  size?: number;
  /** Injectable so a deck is reproducible under test. */
  random?: () => number;
}

/**
 * Untested patterns first, then the ones being named wrong. A pattern with two
 * items and both correct is not evidence of anything, so the sample size is
 * part of the ordering rather than a filter on it.
 */
function priority(rung: LadderRung, recognition: Map<string, RecognitionStat>): number {
  const stat = recognition.get(rung.corePattern);
  if (!stat || stat.seen === 0) return -1;
  return stat.correct / stat.seen;
}

/**
 * One statement per rung before any rung repeats, so a ten-item deck spans ten
 * patterns and measures recognition rather than one pattern ten times.
 */
export function buildDeck(request: DeckRequest): DeckItem[] {
  const { exclude, recognition, touchedRungIds, size = DECK_SIZE } = request;
  const random = request.random ?? Math.random;

  const pool = touchedRungIds.size > 0
    ? LADDER.filter((r) => touchedRungIds.has(r.id))
    : LADDER;

  // A deck drawn only from started rungs can run dry; the whole ladder backs it.
  const sources = pool.length * 2 < size ? LADDER : pool;

  const available = sources
    .map((rung) => ({
      rung,
      problems: rung.problems.filter((p) => !exclude.has(p.slug)),
    }))
    .filter((entry) => entry.problems.length > 0)
    .sort((a, b) => priority(a.rung, recognition) - priority(b.rung, recognition));

  const deck: DeckItem[] = [];
  const used = new Set<string>();

  for (let pass = 0; deck.length < size && pass < 4; pass += 1) {
    for (const entry of available) {
      if (deck.length >= size) break;
      const choices = entry.problems.filter((p) => !used.has(p.slug));
      if (choices.length === 0) continue;
      const pick = choices[Math.floor(random() * choices.length)];
      used.add(pick.slug);
      deck.push({
        slug: pick.slug,
        number: pick.number,
        title: pick.title,
        difficulty: pick.difficulty,
        rungId: entry.rung.id,
        pattern: entry.rung.corePattern,
      });
    }
  }

  return deck;
}

/** What the client is allowed to see before it answers. */
export type BlindDeckItem = Omit<DeckItem, 'pattern'>;

export function blindfold(deck: DeckItem[]): BlindDeckItem[] {
  return deck.map(({ pattern: _pattern, ...rest }) => rest);
}
