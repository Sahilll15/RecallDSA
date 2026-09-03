'use client';

import { useMemo } from 'react';
import { Lock } from 'lucide-react';
import { DagMap, type DagNode, type DagState } from '@/components/graph/dag-map';
import { LADDER } from '@/lib/pattern-ladder';
import type { RungStanding } from '@/lib/ladder-graph';

const STATE: Record<RungStanding['state'], DagState> = {
  locked: 'locked',
  next: 'next',
  'in-progress': 'active',
  complete: 'done',
};

/** The ladder as a prerequisite map. Layout and interaction live in DagMap. */
export function LadderMap({
  standings,
  selected,
  onSelect,
}: {
  standings: Map<string, RungStanding>;
  selected: string | null;
  onSelect: (rungId: string | null) => void;
}) {
  const nodes = useMemo<DagNode[]>(
    () =>
      LADDER.map((rung) => {
        const s = standings.get(rung.id);
        const solved = s?.solvedUnaided ?? 0;
        return {
          id: rung.id,
          deps: rung.deps,
          title: rung.name,
          meta: `${solved} of ${rung.problems.length} solved`,
          state: STATE[s?.state ?? 'locked'],
          progress: solved / rung.problems.length,
          opensNext: s?.anchorsCleared ?? false,
        };
      }),
    [standings],
  );

  return (
    <DagMap
      nodes={nodes}
      selected={selected}
      onSelect={onSelect}
      legend={
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.8125rem] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm shadow-[0_0_0_1.5px_hsl(var(--warning))]" />
            up next
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
            complete
          </span>
          <span className="flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            after its prerequisites
          </span>
          <span className="ml-auto hidden md:inline">
            Hover a rung to see what leads to it and what it opens
          </span>
        </div>
      }
    />
  );
}
