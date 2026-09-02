import type { Level, Plan, PlanId, Track, TrackId } from './types';
import { scratch, swe, prod } from './tracks-ai';
import { hld, lld } from './tracks-design';
import { dsa } from './tracks-dsa';
import { scratch30, agentic30 } from './plans';

export type { Level, Plan, PlanId, Track, TrackId } from './types';
export { PROJECTS, PROJECT_TIERS } from './projects';

export const LEVELS: Record<Level, { label: string; cssVar: string }> = {
  F: { label: 'Foundations', cssVar: '--rm-lv-f' },
  C: { label: 'Core', cssVar: '--rm-lv-c' },
  A: { label: 'Advanced', cssVar: '--rm-lv-a' },
};

export const LEVEL_ORDER: Level[] = ['F', 'C', 'A'];

/** Two-letter monogram shown in place of an icon. */
export type TrackWithMono = Track & { mono: string };
export type PlanWithMono = Plan & { mono: string };

export const TRACKS: Record<TrackId, TrackWithMono> = {
  scratch: { ...scratch, mono: 'ML' },
  swe: { ...swe, mono: 'SW' },
  prod: { ...prod, mono: 'PR' },
  hld: { ...hld, mono: 'HL' },
  lld: { ...lld, mono: 'LL' },
  dsa: { ...dsa, mono: 'DS' },
};

export const PLANS: Record<PlanId, PlanWithMono> = {
  scratch30: { ...scratch30, mono: '30' },
  agentic30: { ...agentic30, mono: '30' },
};

export const TRACK_ORDER: TrackId[] = ['scratch', 'swe', 'prod', 'hld', 'lld', 'dsa'];
export const PLAN_ORDER: PlanId[] = ['scratch30', 'agentic30'];

export function isTrackId(value: unknown): value is TrackId {
  return typeof value === 'string' && value in TRACKS;
}

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === 'string' && value in PLANS;
}

export function trackHours(track: Track): number {
  return track.nodes.reduce((sum, n) => sum + (n.h || 0), 0);
}

export function planHours(plan: Plan): number {
  return plan.days.reduce((sum, d) => sum + (d.hours || 0), 0);
}
