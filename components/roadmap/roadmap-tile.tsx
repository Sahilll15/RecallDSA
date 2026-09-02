'use client';

import Link from 'next/link';
import { ArrowRight, Map as MapIcon } from 'lucide-react';
import {
  AnimatedCard,
  AnimatedCardContent,
  AnimatedCardDescription,
  AnimatedCardHeader,
} from '@/components/ui/animated-card';
import { Button } from '@/components/ui/button';
import type { RoadmapOverview } from '@/lib/roadmap/progress';
import { cn } from '@/lib/utils';

/** Dashboard summary of the learning roadmap, so progress lives next to recall stats. */
export function RoadmapTile({ overview, delay = 0 }: { overview: RoadmapOverview; delay?: number }) {
  const started = overview.nodesDone > 0 || overview.activePlan.daysDone > 0 || overview.projectsBuilt > 0;
  const trackPct = overview.focusTrack.total
    ? Math.round((overview.focusTrack.done / overview.focusTrack.total) * 100)
    : 0;

  return (
    <AnimatedCard delay={delay}>
      <AnimatedCardHeader>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="eyebrow flex items-center gap-1.5">
              <MapIcon className="h-3.5 w-3.5 text-primary" />
              Learning roadmap
            </p>
            <AnimatedCardDescription>
              {started
                ? `${overview.nodesDone} of ${overview.nodesTotal} topics done across six roadmaps`
                : 'Six skill trees, two 30-day plans and a project portfolio. Nothing marked yet.'}
            </AnimatedCardDescription>
          </div>
          <Link href="/roadmap">
            <Button size="sm" variant="outline" className="group">
              Open roadmap
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </AnimatedCardHeader>
      {started && (
        <AnimatedCardContent>
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="space-y-2">
              <p className="eyebrow">Focus track</p>
              <p className="truncate text-sm font-medium" title={overview.focusTrack.name}>
                {overview.focusTrack.name}
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${trackPct}%` }} />
              </div>
              <p className="font-mono text-xs text-muted-foreground" data-numeric>
                {overview.focusTrack.done}/{overview.focusTrack.total} topics
              </p>
            </div>
            <div className="space-y-1">
              <p className="eyebrow">Active plan</p>
              <p className="truncate text-sm font-medium" title={overview.activePlan.name}>
                {overview.activePlan.name}
              </p>
              <p data-numeric className="font-display text-2xl font-semibold">
                {overview.activePlan.day === null ? 'Done' : `Day ${overview.activePlan.day}`}
                <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                  {overview.activePlan.daysDone}/{overview.activePlan.totalDays} days
                </span>
              </p>
            </div>
            <div className="space-y-1">
              <p className="eyebrow">Projects and streak</p>
              <p data-numeric className="font-display text-2xl font-semibold">
                {overview.projectsBuilt}
                <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                  built{overview.projectsBuilding > 0 ? `, ${overview.projectsBuilding} in progress` : ''}
                </span>
              </p>
              <p
                className={cn(
                  'font-mono text-xs',
                  overview.currentStreak > 0 ? 'text-warning' : 'text-muted-foreground',
                )}
                data-numeric
              >
                {overview.currentStreak} day streak
              </p>
            </div>
          </div>
        </AnimatedCardContent>
      )}
    </AnimatedCard>
  );
}
