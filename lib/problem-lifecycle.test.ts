import { describe, expect, it } from 'vitest';
import { carriesHistory } from './problem-lifecycle';

const problem = (overrides: Partial<Parameters<typeof carriesHistory>[0]> = {}) => ({
  id: 'p1',
  _count: { revisions: 0, attempts: 0, mistakes: 0 },
  recallNote: null,
  ...overrides,
});

describe('carriesHistory', () => {
  it('is false for a problem with nothing attached', () => {
    expect(carriesHistory(problem())).toBe(false);
  });

  it('is true when a revision exists', () => {
    expect(carriesHistory(problem({ _count: { revisions: 1, attempts: 0, mistakes: 0 } }))).toBe(true);
  });

  it('is true when an attempt exists', () => {
    expect(carriesHistory(problem({ _count: { revisions: 0, attempts: 1, mistakes: 0 } }))).toBe(true);
  });

  it('is true when a mistake exists', () => {
    expect(carriesHistory(problem({ _count: { revisions: 0, attempts: 0, mistakes: 1 } }))).toBe(true);
  });

  it('is true when a recall note exists, even with no counted relations', () => {
    expect(carriesHistory(problem({ recallNote: { id: 'n1' } }))).toBe(true);
  });
});
