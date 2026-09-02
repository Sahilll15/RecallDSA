import { describe, expect, it } from 'vitest';
import { PLANS, PLAN_ORDER, PROJECTS, TRACKS, TRACK_ORDER } from './catalog';
import {
  computeStreaks,
  cycleProject,
  DEFAULT_PROGRESS,
  isNextNode,
  localDay,
  mergeProgress,
  setNote,
  summarizeOverview,
  summarizePlan,
  summarizeTrack,
  toggleNode,
  toggleTask,
} from './progress';

const day = (offset: number, from = new Date(2026, 8, 2, 12)) => {
  const d = new Date(from);
  d.setDate(d.getDate() + offset);
  return d;
};

describe('catalog integrity', () => {
  it('every dependency points at a node in the same track, and ids are unique', () => {
    for (const id of TRACK_ORDER) {
      const track = TRACKS[id];
      const ids = new Set<string>();
      for (const node of track.nodes) {
        expect(ids.has(node.id), `${id}:${node.id} duplicated`).toBe(false);
        ids.add(node.id);
      }
      for (const node of track.nodes) {
        for (const dep of node.deps) {
          expect(ids.has(dep), `${id}:${node.id} depends on missing ${dep}`).toBe(true);
        }
      }
      expect(track.nodes.some((n) => n.deps.length === 0), `${id} has no root`).toBe(true);
    }
  });

  it('plans are 30 numbered days with at least one task each', () => {
    for (const id of PLAN_ORDER) {
      const plan = PLANS[id];
      expect(plan.days.map((d) => d.d)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
      for (const d of plan.days) expect(d.tasks.length).toBeGreaterThan(0);
    }
  });

  it('projects reference real tracks and have unique ids', () => {
    const ids = new Set<string>();
    for (const p of PROJECTS) {
      expect(ids.has(p.id)).toBe(false);
      ids.add(p.id);
      for (const t of p.tracks) expect(TRACKS[t], `${p.id} -> ${t}`).toBeDefined();
    }
  });
});

describe('mergeProgress', () => {
  it('returns defaults for garbage input', () => {
    expect(mergeProgress(null)).toEqual(DEFAULT_PROGRESS);
    expect(mergeProgress('nope')).toEqual(DEFAULT_PROGRESS);
    expect(mergeProgress([1, 2])).toEqual(DEFAULT_PROGRESS);
  });

  it('accepts the old app export shape and drops what it does not know', () => {
    const legacy = {
      tracks: { swe: { done: { llm: true, rag: 'yes' } }, bogus: { done: { x: true } } },
      plans: { agentic30: { tasks: { '1-0': true, '1-1': false } } },
      projects: { 'streaming-chat': 'done', other: 'weird' },
      activity: { '2026-08-31': 3, 'not-a-day': 2, '2026-09-01': 0 },
      notes: { 'swe:llm': 'remember tokens', 'swe:rag': '   ' },
      settings: { hoursPerDay: 40 },
      ui: { view: 'plan', track: 'nope', plan: 'agentic30', theme: 'dark', projFilter: 'hld' },
      extra: { anything: 1 },
    };
    const merged = mergeProgress(legacy);
    expect(merged.tracks).toEqual({ swe: { done: { llm: true } } });
    expect(merged.plans).toEqual({ agentic30: { tasks: { '1-0': true } } });
    expect(merged.projects).toEqual({ 'streaming-chat': 'done' });
    expect(merged.activity).toEqual({ '2026-08-31': 3 });
    expect(merged.notes).toEqual({ 'swe:llm': 'remember tokens' });
    expect(merged.settings.hoursPerDay).toBe(12);
    // The old app's "plan" view id is not a view here, so it falls back.
    expect(merged.ui).toEqual({ view: 'map', track: 'swe', plan: 'agentic30', projFilter: 'hld' });
    expect('extra' in merged).toBe(false);
  });

  it('round-trips its own output unchanged', () => {
    let s = toggleNode(DEFAULT_PROGRESS, 'dsa', 'arrays', day(0));
    s = toggleTask(s, 'scratch30', 3, 1, day(0));
    s = cycleProject(s, 'streaming-chat', day(0));
    s = setNote(s, 'dsa', 'arrays', 'prefix sums');
    expect(mergeProgress(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });
});

describe('mutations', () => {
  it('toggleNode marks, unmarks, and only counts activity on marking', () => {
    const today = day(0);
    const marked = toggleNode(DEFAULT_PROGRESS, 'swe', 'llm', today);
    expect(marked.tracks.swe?.done).toEqual({ llm: true });
    expect(marked.activity[localDay(today)]).toBe(1);

    const unmarked = toggleNode(marked, 'swe', 'llm', today);
    expect(unmarked.tracks.swe?.done).toEqual({});
    expect(unmarked.activity[localDay(today)]).toBe(1);
  });

  it('toggleTask keys by day and index', () => {
    const s = toggleTask(DEFAULT_PROGRESS, 'agentic30', 4, 2, day(0));
    expect(s.plans.agentic30?.tasks).toEqual({ '4-2': true });
  });

  it('cycleProject walks none -> building -> done -> none and credits only completion', () => {
    const today = day(0);
    const building = cycleProject(DEFAULT_PROGRESS, 'p', today);
    expect(building.projects.p).toBe('building');
    expect(building.activity).toEqual({});
    const done = cycleProject(building, 'p', today);
    expect(done.projects.p).toBe('done');
    expect(done.activity[localDay(today)]).toBe(1);
    const cleared = cycleProject(done, 'p', today);
    expect(cleared.projects.p).toBeUndefined();
  });

  it('setNote removes the key when blank', () => {
    const s = setNote(DEFAULT_PROGRESS, 'hld', 'fund', 'napkin math');
    expect(s.notes['hld:fund']).toBe('napkin math');
    expect(setNote(s, 'hld', 'fund', '  ').notes).toEqual({});
  });
});

describe('computeStreaks', () => {
  it('counts back from today, with grace for an unstudied today', () => {
    const today = day(0);
    const activity = {
      [localDay(day(-1))]: 1,
      [localDay(day(-2))]: 2,
      [localDay(day(-3))]: 1,
      [localDay(day(-10))]: 1,
    };
    expect(computeStreaks(activity, today)).toEqual({ current: 3, best: 3 });
    expect(computeStreaks({ ...activity, [localDay(today)]: 1 }, today).current).toBe(4);
  });

  it('breaks on a gap and finds the best historical run', () => {
    const today = day(0);
    const activity = {
      [localDay(day(-2))]: 1,
      [localDay(day(-20))]: 1,
      [localDay(day(-21))]: 1,
      [localDay(day(-22))]: 1,
      [localDay(day(-23))]: 1,
      [localDay(day(-24))]: 1,
    };
    expect(computeStreaks(activity, today)).toEqual({ current: 0, best: 5 });
  });
});

describe('summaries', () => {
  it('summarizeTrack and isNextNode agree on the frontier', () => {
    const track = TRACKS.dsa;
    const root = track.nodes.find((n) => n.deps.length === 0)!;
    expect(isNextNode(root, {})).toBe(true);
    const child = track.nodes.find((n) => n.deps.includes(root.id))!;
    expect(isNextNode(child, {})).toBe(false);
    expect(isNextNode(child, { [root.id]: true })).toBe(true);

    const sum = summarizeTrack(track, { [root.id]: true });
    expect(sum.done).toBe(1);
    expect(sum.doneHours).toBe(root.h);
    expect(sum.pct).toBe(Math.round((1 / track.nodes.length) * 100));
  });

  it('summarizePlan projects a finish date from remaining hours and pace', () => {
    const plan = PLANS.agentic30;
    const now = day(0);
    const empty = summarizePlan(plan, {}, 2.5, now);
    expect(empty.daysDone).toBe(0);
    expect(empty.currentDay).toBe(1);
    expect(empty.calendarDays).toBe(Math.ceil(empty.totalHours / 2.5));
    expect(empty.finish?.getTime()).toBe(now.getTime() + empty.calendarDays * 86400000);

    const all: Record<string, true> = {};
    for (const d of plan.days) d.tasks.forEach((_, i) => (all[`${d.d}-${i}`] = true));
    const full = summarizePlan(plan, all, 2.5, now);
    expect(full.daysDone).toBe(30);
    expect(full.currentDay).toBeNull();
    expect(full.calendarDays).toBe(0);
    expect(full.finish).toBeNull();
  });

  it('summarizeOverview totals nodes across every track', () => {
    const total = TRACK_ORDER.reduce((s, id) => s + TRACKS[id].nodes.length, 0);
    let s = toggleNode(DEFAULT_PROGRESS, 'dsa', 'arrays', day(0));
    s = cycleProject(s, PROJECTS[0].id, day(0));
    const overview = summarizeOverview(
      s,
      PROJECTS.map((p) => p.id),
      day(0),
    );
    expect(overview.nodesTotal).toBe(total);
    expect(overview.nodesDone).toBe(1);
    expect(overview.projectsBuilding).toBe(1);
    expect(overview.currentStreak).toBe(1);
    expect(overview.activePlan.id).toBe('agentic30');
  });
});
