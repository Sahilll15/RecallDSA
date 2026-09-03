import { describe, expect, it } from 'vitest';
import { TIME_BUDGET_MIN, type LadderDifficulty } from './pattern-ladder';
import { formatClock, phaseAt, phasesFor } from './solve-protocol';

const DIFFICULTIES: LadderDifficulty[] = ['easy', 'medium', 'hard'];

describe('phasesFor', () => {
  it('runs the five phases in order with no gap between them', () => {
    for (const difficulty of DIFFICULTIES) {
      const phases = phasesFor(difficulty);
      expect(phases.map((p) => p.id)).toEqual([
        'restate',
        'name',
        'implement',
        'hint',
        'editorial',
      ]);
      expect(phases[0].startMin).toBe(0);
      for (let i = 1; i < phases.length; i += 1) {
        expect(phases[i].startMin, difficulty).toBe(phases[i - 1].endMin);
      }
    }
  });

  it('spends exactly the difficulty budget before any help is allowed', () => {
    for (const difficulty of DIFFICULTIES) {
      const hint = phasesFor(difficulty).find((p) => p.id === 'hint');
      expect(hint?.startMin, difficulty).toBe(TIME_BUDGET_MIN[difficulty]);
    }
  });

  it('leaves the editorial phase open-ended', () => {
    const last = phasesFor('medium').at(-1);
    expect(last?.id).toBe('editorial');
    expect(last?.endMin).toBeNull();
  });

  it('scales with difficulty', () => {
    expect(phasesFor('hard')[0].endMin).toBeGreaterThan(
      phasesFor('easy')[0].endMin as number,
    );
  });
});

describe('phaseAt', () => {
  const phases = phasesFor('medium');

  it('starts in restate', () => {
    expect(phaseAt(phases, 0).id).toBe('restate');
    expect(phaseAt(phases, 60).id).toBe('restate');
  });

  it('moves on at each boundary rather than a second late', () => {
    expect(phaseAt(phases, 5 * 60).id).toBe('name');
    expect(phaseAt(phases, 10 * 60).id).toBe('implement');
    expect(phaseAt(phases, 25 * 60).id).toBe('hint');
  });

  it('holds on the editorial phase however long the attempt runs', () => {
    expect(phaseAt(phases, 35 * 60).id).toBe('editorial');
    expect(phaseAt(phases, 60 * 60 * 5).id).toBe('editorial');
  });
});

describe('formatClock', () => {
  it('pads the seconds', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(65)).toBe('1:05');
    expect(formatClock(600)).toBe('10:00');
  });

  it('does not render a negative clock', () => {
    expect(formatClock(-5)).toBe('0:00');
  });
});
