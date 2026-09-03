'use client';

import { useMemo, useRef } from 'react';
import { DagMap, type DagNode } from '@/components/graph/dag-map';
import type { TrackWithMono } from '@/lib/roadmap/catalog';
import { isNextNode, noteKey, type RoadmapProgress } from '@/lib/roadmap/progress';
import type { TrackId } from '@/lib/roadmap/types';
import { InstrumentPanel } from './instrument-panel';
import { LevelMark } from './level-mark';
import { NodeDrawer } from './node-drawer';

export interface FocusRequest {
  track: TrackId;
  node: string;
  /** Changes on every request so the same node can be re-focused. */
  n: number;
}

interface MapViewProps {
  track: TrackWithMono;
  trackId: TrackId;
  progress: RoadmapProgress;
  selected: string | null;
  focus: FocusRequest | null;
  onSelect: (nodeId: string | null) => void;
  onSelectTrack: (id: TrackId) => void;
  onToggleNode: (trackId: TrackId, nodeId: string) => void;
  onNote: (trackId: TrackId, nodeId: string, text: string) => void;
  onReset: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

/**
 * One skill tree, drawn by DagMap in prerequisite rows. The hand-placed x/y on
 * each node are no longer read: a layered layout at body size on a scrolling
 * page beat a zoomable canvas that shrank every title to a few pixels.
 */
export function MapView({
  track,
  trackId,
  progress,
  selected,
  focus,
  onSelect,
  onSelectTrack,
  onToggleNode,
  onNote,
  onReset,
  onExport,
  onImport,
}: MapViewProps) {
  const done = useMemo(() => progress.tracks[trackId]?.done || {}, [progress, trackId]);
  const mapRef = useRef<HTMLDivElement>(null);

  const nodes = useMemo<DagNode[]>(
    () =>
      track.nodes.map((node) => {
        const isDone = !!done[node.id];
        const next = !isDone && isNextNode(node, done);
        return {
          id: node.id,
          deps: node.deps,
          title: node.t,
          meta: `about ${node.h}h`,
          aside: <LevelMark level={node.lv} />,
          state: isDone ? 'done' : next ? 'next' : 'locked',
          progress: isDone ? 1 : 0,
          opensNext: isDone,
        };
      }),
    [track, done],
  );

  const selectedNode = selected ? track.nodes.find((n) => n.id === selected) || null : null;
  const focusFor = focus && focus.track === trackId ? { id: focus.node, n: focus.n } : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div ref={mapRef}>
        <DagMap
          nodes={nodes}
          selected={selected}
          onSelect={onSelect}
          focus={focusFor}
          legend={
            <p className="text-[0.8125rem] text-muted-foreground">
              Mark a topic done and the ones it unlocks light up. Hover any topic to trace its
              path.
            </p>
          }
        />
      </div>

      <InstrumentPanel
        track={track}
        trackId={trackId}
        done={done}
        activity={progress.activity}
        onSelectTrack={onSelectTrack}
        onFit={() => mapRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })}
        onExport={onExport}
        onImport={onImport}
        onReset={onReset}
      />

      <NodeDrawer
        node={selectedNode}
        done={selectedNode ? !!done[selectedNode.id] : false}
        note={selectedNode ? progress.notes[noteKey(trackId, selectedNode.id)] || '' : ''}
        onNote={(text) => selectedNode && onNote(trackId, selectedNode.id, text)}
        onClose={() => onSelect(null)}
        onToggle={() => selectedNode && onToggleNode(trackId, selectedNode.id)}
      />
    </div>
  );
}
