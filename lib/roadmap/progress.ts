import { isPlanId, isTrackId, PLANS, TRACKS } from './catalog';
import type { Plan, PlanId, ProjectStatus, Track, TrackId } from './types';

/** One JSON document per user. Keys are stable ids from the catalog. */
export interface RoadmapProgress {
  tracks: Partial<Record<TrackId, { done: Record<string, true> }>>;
  plans: Partial<Record<PlanId, { tasks: Record<string, true> }>>;
  projects: Record<string, ProjectStatus>;
  /** Positive completions per local calendar day, `YYYY-MM-DD`. */
  activity: Record<string, number>;
  /** Free-text notes keyed `${trackId}:${nodeId}`. */
  notes: Record<string, string>;
  settings: { hoursPerDay: number };
  ui: { view: RoadmapView; track: TrackId; plan: PlanId; projFilter: string };
}

export type RoadmapView = 'map' | 'plans' | 'projects';

export const ROADMAP_VIEWS: RoadmapView[] = ['map', 'plans', 'projects'];

export const DEFAULT_PROGRESS: RoadmapProgress = {
  tracks: {},
  plans: {},
  projects: {},
  activity: {},
  notes: {},
  settings: { hoursPerDay: 2.5 },
  ui: { view: 'map', track: 'swe', plan: 'agentic30', projFilter: 'all' },
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function trueMap(v: unknown): Record<string, true> {
  const out: Record<string, true> = {};
  if (!isRecord(v)) return out;
  for (const [k, val] of Object.entries(v)) if (val === true) out[k] = true;
  return out;
}

/**
 * Coerces any untrusted blob (old export file, stale localStorage, request
 * body) into a well-formed progress document. Unknown keys and ill-typed
 * values are dropped rather than rejected so a partial import still lands.
 */
export function mergeProgress(saved: unknown): RoadmapProgress {
  const s = isRecord(saved) ? saved : {};

  const tracks: RoadmapProgress['tracks'] = {};
  if (isRecord(s.tracks)) {
    for (const [tid, val] of Object.entries(s.tracks)) {
      if (isTrackId(tid) && isRecord(val)) tracks[tid] = { done: trueMap(val.done) };
    }
  }

  const plans: RoadmapProgress['plans'] = {};
  if (isRecord(s.plans)) {
    for (const [pid, val] of Object.entries(s.plans)) {
      if (isPlanId(pid) && isRecord(val)) plans[pid] = { tasks: trueMap(val.tasks) };
    }
  }

  const projects: RoadmapProgress['projects'] = {};
  if (isRecord(s.projects)) {
    for (const [id, val] of Object.entries(s.projects)) {
      if (val === 'building' || val === 'done') projects[id] = val;
    }
  }

  const activity: RoadmapProgress['activity'] = {};
  if (isRecord(s.activity)) {
    for (const [day, val] of Object.entries(s.activity)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(day) && typeof val === 'number' && val > 0) {
        activity[day] = Math.floor(val);
      }
    }
  }

  const notes: RoadmapProgress['notes'] = {};
  if (isRecord(s.notes)) {
    for (const [k, val] of Object.entries(s.notes)) {
      if (typeof val === 'string' && val.trim()) notes[k] = val.slice(0, 5000);
    }
  }

  const rawHours = isRecord(s.settings) ? s.settings.hoursPerDay : undefined;
  const hoursPerDay =
    typeof rawHours === 'number' && Number.isFinite(rawHours)
      ? Math.min(12, Math.max(0.5, rawHours))
      : DEFAULT_PROGRESS.settings.hoursPerDay;

  const ui = isRecord(s.ui) ? s.ui : {};
  const view = ROADMAP_VIEWS.includes(ui.view as RoadmapView)
    ? (ui.view as RoadmapView)
    : DEFAULT_PROGRESS.ui.view;

  return {
    tracks,
    plans,
    projects,
    activity,
    notes,
    settings: { hoursPerDay },
    ui: {
      view,
      track: isTrackId(ui.track) ? ui.track : DEFAULT_PROGRESS.ui.track,
      plan: isPlanId(ui.plan) ? ui.plan : DEFAULT_PROGRESS.ui.plan,
      projFilter: typeof ui.projFilter === 'string' ? ui.projFilter : 'all',
    },
  };
}

/** Local calendar day, matching lib/activity's dayKey. */
export function localDay(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

function bumpActivity(
  activity: RoadmapProgress['activity'],
  today: Date,
): RoadmapProgress['activity'] {
  const k = localDay(today);
  return { ...activity, [k]: (activity[k] || 0) + 1 };
}

export function taskKey(day: number, index: number): string {
  return `${day}-${index}`;
}

export function noteKey(trackId: TrackId, nodeId: string): string {
  return `${trackId}:${nodeId}`;
}

/* ---------- pure mutations: every positive completion counts toward the streak ---------- */

export function toggleNode(
  s: RoadmapProgress,
  trackId: TrackId,
  nodeId: string,
  today = new Date(),
): RoadmapProgress {
  const done = { ...(s.tracks[trackId]?.done || {}) };
  const marking = !done[nodeId];
  if (marking) done[nodeId] = true;
  else delete done[nodeId];
  return {
    ...s,
    tracks: { ...s.tracks, [trackId]: { done } },
    activity: marking ? bumpActivity(s.activity, today) : s.activity,
  };
}

export function toggleTask(
  s: RoadmapProgress,
  planId: PlanId,
  day: number,
  index: number,
  today = new Date(),
): RoadmapProgress {
  const tasks = { ...(s.plans[planId]?.tasks || {}) };
  const k = taskKey(day, index);
  const marking = !tasks[k];
  if (marking) tasks[k] = true;
  else delete tasks[k];
  return {
    ...s,
    plans: { ...s.plans, [planId]: { tasks } },
    activity: marking ? bumpActivity(s.activity, today) : s.activity,
  };
}

/** none -> building -> done -> none. Only reaching "done" counts as activity. */
export function cycleProject(
  s: RoadmapProgress,
  projectId: string,
  today = new Date(),
): RoadmapProgress {
  const projects = { ...s.projects };
  let finished = false;
  if (!projects[projectId]) projects[projectId] = 'building';
  else if (projects[projectId] === 'building') {
    projects[projectId] = 'done';
    finished = true;
  } else delete projects[projectId];
  return { ...s, projects, activity: finished ? bumpActivity(s.activity, today) : s.activity };
}

export function setNote(
  s: RoadmapProgress,
  trackId: TrackId,
  nodeId: string,
  text: string,
): RoadmapProgress {
  const notes = { ...s.notes };
  const k = noteKey(trackId, nodeId);
  if (text.trim()) notes[k] = text;
  else delete notes[k];
  return { ...s, notes };
}

export function resetTrack(s: RoadmapProgress, trackId: TrackId): RoadmapProgress {
  return { ...s, tracks: { ...s.tracks, [trackId]: { done: {} } } };
}

/* ---------- derived readings ---------- */

export function computeStreaks(
  activity: RoadmapProgress['activity'],
  today = new Date(),
): { current: number; best: number } {
  const has = (d: Date) => (activity[localDay(d)] || 0) > 0;
  let current = 0;
  const cursor = new Date(today);
  // Grace: an unstudied "today" does not break yesterday's run.
  if (!has(cursor)) cursor.setDate(cursor.getDate() - 1);
  while (has(cursor)) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const days = Object.keys(activity)
    .filter((k) => activity[k] > 0)
    .sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const k of days) {
    if (prev) {
      const [y, m, d] = prev.split('-').map(Number);
      const next = new Date(y, m - 1, d + 1);
      run = localDay(next) === k ? run + 1 : 1;
    } else run = 1;
    best = Math.max(best, run);
    prev = k;
  }
  return { current, best };
}

export interface TrackSummary {
  total: number;
  done: number;
  pct: number;
  totalHours: number;
  doneHours: number;
}

export function summarizeTrack(track: Track, done: Record<string, true>): TrackSummary {
  const total = track.nodes.length;
  const finished = track.nodes.filter((n) => done[n.id]);
  const totalHours = track.nodes.reduce((sum, n) => sum + n.h, 0);
  const doneHours = finished.reduce((sum, n) => sum + n.h, 0);
  return {
    total,
    done: finished.length,
    pct: total ? Math.round((finished.length / total) * 100) : 0,
    totalHours,
    doneHours,
  };
}

/** A node is "next" when every dependency is done and it is not. Roots qualify. */
export function isNextNode(node: Track['nodes'][number], done: Record<string, true>): boolean {
  return !done[node.id] && node.deps.every((d) => done[d]);
}

export interface PlanSummary {
  daysDone: number;
  totalDays: number;
  tasksDone: number;
  totalTasks: number;
  hoursDone: number;
  totalHours: number;
  remainingHours: number;
  /** Calendar days left at the chosen pace; 0 when the plan is finished. */
  calendarDays: number;
  finish: Date | null;
  currentDay: number | null;
}

export function summarizePlan(
  plan: Plan,
  tasks: Record<string, true>,
  hoursPerDay: number,
  now = new Date(),
): PlanSummary {
  const dayDone = (d: Plan['days'][number]) => d.tasks.every((_, i) => tasks[taskKey(d.d, i)]);
  const finishedDays = plan.days.filter(dayDone);
  const totalTasks = plan.days.reduce((s, d) => s + d.tasks.length, 0);
  const tasksDone = plan.days.reduce(
    (s, d) => s + d.tasks.filter((_, i) => tasks[taskKey(d.d, i)]).length,
    0,
  );
  const totalHours = plan.days.reduce((s, d) => s + d.hours, 0);
  const hoursDone = finishedDays.reduce((s, d) => s + d.hours, 0);
  const remainingHours = Math.max(0, totalHours - hoursDone);
  const calendarDays =
    remainingHours === 0 ? 0 : Math.ceil(remainingHours / Math.max(0.5, hoursPerDay));
  const current = plan.days.find((d) => !dayDone(d));
  return {
    daysDone: finishedDays.length,
    totalDays: plan.days.length,
    tasksDone,
    totalTasks,
    hoursDone,
    totalHours,
    remainingHours,
    calendarDays,
    finish: remainingHours === 0 ? null : new Date(now.getTime() + calendarDays * 86400000),
    currentDay: current ? current.d : null,
  };
}

/** Rolled-up figures for the dashboard tile. */
export interface RoadmapOverview {
  nodesDone: number;
  nodesTotal: number;
  projectsBuilt: number;
  projectsBuilding: number;
  currentStreak: number;
  activePlan: { id: PlanId; name: string; day: number | null; daysDone: number; totalDays: number };
  focusTrack: { id: TrackId; name: string; done: number; total: number };
}

export function summarizeOverview(
  s: RoadmapProgress,
  projectIds: string[],
  today = new Date(),
): RoadmapOverview {
  let nodesDone = 0;
  let nodesTotal = 0;
  for (const track of Object.values(TRACKS)) {
    const sum = summarizeTrack(track, s.tracks[track.id]?.done || {});
    nodesDone += sum.done;
    nodesTotal += sum.total;
  }
  const projectsBuilt = projectIds.filter((id) => s.projects[id] === 'done').length;
  const projectsBuilding = projectIds.filter((id) => s.projects[id] === 'building').length;
  const plan = PLANS[s.ui.plan];
  const planSum = summarizePlan(plan, s.plans[plan.id]?.tasks || {}, s.settings.hoursPerDay, today);
  const track = TRACKS[s.ui.track];
  const trackSum = summarizeTrack(track, s.tracks[track.id]?.done || {});
  return {
    nodesDone,
    nodesTotal,
    projectsBuilt,
    projectsBuilding,
    currentStreak: computeStreaks(s.activity, today).current,
    activePlan: {
      id: plan.id,
      name: plan.name,
      day: planSum.currentDay,
      daysDone: planSum.daysDone,
      totalDays: planSum.totalDays,
    },
    focusTrack: { id: track.id, name: track.name, done: trackSum.done, total: trackSum.total },
  };
}
