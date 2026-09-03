import { TIME_BUDGET_MIN, type LadderDifficulty } from './pattern-ladder';

/**
 * The stopping rule for a first attempt.
 *
 * Sitting on a problem for two hours and then reading the answer teaches
 * nothing and feels like failure; giving up at four minutes teaches nothing
 * either. The phases below spend the budget in a fixed order, so an attempt
 * ends either in a solve or in a logged debt, never in an open-ended stall.
 */

export type PhaseId = 'restate' | 'name' | 'implement' | 'hint' | 'editorial';

export interface SolvePhase {
  id: PhaseId;
  label: string;
  instruction: string;
  /** Minutes from the start of the attempt. The last phase has no end. */
  startMin: number;
  endMin: number | null;
}

/** Shares of the difficulty budget spent before any help is allowed. */
const SHARES: Record<'restate' | 'name' | 'implement' | 'hint', number> = {
  restate: 0.2,
  name: 0.2,
  implement: 0.6,
  hint: 0.4,
};

export function phasesFor(difficulty: LadderDifficulty): SolvePhase[] {
  const budget = TIME_BUDGET_MIN[difficulty];
  const restate = Math.round(budget * SHARES.restate);
  const name = Math.round(budget * SHARES.name);
  const implement = Math.round(budget * SHARES.implement);
  const hint = Math.round(budget * SHARES.hint);

  const bounds = [restate, name, implement, hint];
  const starts = bounds.reduce<number[]>(
    (acc, len) => [...acc, acc[acc.length - 1] + len],
    [0],
  );

  return [
    {
      id: 'restate',
      label: 'Restate',
      instruction:
        'Say the problem back in your own words, then write the brute force and its complexity. No editor yet.',
      startMin: starts[0],
      endMin: starts[1],
    },
    {
      id: 'name',
      label: 'Name the pattern',
      instruction:
        'Name the pattern and the feature in the statement that gives it away. If you cannot, the gap is recognition, not code.',
      startMin: starts[1],
      endMin: starts[2],
    },
    {
      id: 'implement',
      label: 'Implement',
      instruction: 'Write it. Stay with your own approach even if it is not the tidiest one.',
      startMin: starts[2],
      endMin: starts[3],
    },
    {
      id: 'hint',
      label: 'One hint',
      instruction:
        'One hint only, then back to the editor. Log this as hinted whatever happens next.',
      startMin: starts[3],
      endMin: starts[4],
    },
    {
      id: 'editorial',
      label: 'Read it, then close it',
      instruction:
        'Read the editorial, close it, and re-derive from blank before you log. This books a re-derive in two days.',
      startMin: starts[4],
      endMin: null,
    },
  ];
}

export function phaseAt(phases: SolvePhase[], elapsedSec: number): SolvePhase {
  const minutes = elapsedSec / 60;
  return (
    phases.find((p) => minutes >= p.startMin && (p.endMin === null || minutes < p.endMin)) ??
    phases[phases.length - 1]
  );
}

export function formatClock(totalSec: number): string {
  const safe = Math.max(0, Math.floor(totalSec));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
