'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Cloud,
  CloudOff,
  Loader2,
  Map as MapIcon,
  Package,
  Search,
} from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { Button } from '@/components/ui/button';
import { MapView, type FocusRequest } from '@/components/roadmap/map-view';
import { PlanView } from '@/components/roadmap/plan-view';
import { ProjectsView } from '@/components/roadmap/projects-view';
import { SearchPalette } from '@/components/roadmap/search-palette';
import { useRoadmapProgress, type SyncStatus } from '@/components/roadmap/use-roadmap-progress';
import { isPlanId, isTrackId, PLANS, TRACKS } from '@/lib/roadmap/catalog';
import {
  cycleProject,
  localDay,
  resetTrack,
  setNote,
  toggleNode,
  toggleTask,
  type RoadmapProgress,
  type RoadmapView,
} from '@/lib/roadmap/progress';
import type { PlanId, TrackId } from '@/lib/roadmap/types';
import { cn } from '@/lib/utils';

const VIEWS: Array<{ id: RoadmapView; label: string; icon: typeof MapIcon }> = [
  { id: 'map', label: 'Roadmaps', icon: MapIcon },
  { id: 'plans', label: '30-day plans', icon: CalendarDays },
  { id: 'projects', label: 'Projects', icon: Package },
];

const SYNC_LABEL: Record<SyncStatus, { text: string; icon: typeof Cloud; tone: string }> = {
  loading: { text: 'Loading', icon: Loader2, tone: 'text-muted-foreground' },
  saving: { text: 'Saving', icon: Loader2, tone: 'text-muted-foreground' },
  synced: { text: 'Synced', icon: Cloud, tone: 'text-primary' },
  offline: { text: 'Saved on this device only', icon: CloudOff, tone: 'text-warning' },
};

interface Toast {
  id: string;
  msg: string;
  warn?: boolean;
}

export default function RoadmapPage() {
  const { progress, update, replace, hydrated, status } = useRoadmapProgress();
  const [selected, setSelected] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [focus, setFocus] = useState<FocusRequest | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const trackId: TrackId = isTrackId(progress.ui.track) ? progress.ui.track : 'swe';
  const planId: PlanId = isPlanId(progress.ui.plan) ? progress.ui.plan : 'agentic30';
  const track = TRACKS[trackId];
  const plan = PLANS[planId];
  const view = progress.ui.view;

  const pushToast = useCallback((msg: string, warn = false) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, warn }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  }, []);

  const setUi = useCallback(
    (patch: Partial<RoadmapProgress['ui']>) =>
      update((s) => ({ ...s, ui: { ...s.ui, ...patch } })),
    [update],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelected(null);
        setSearchOpen(false);
        return;
      }
      const tag = (document.activeElement as HTMLElement | null)?.tagName || '';
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
      if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const jumpToNode = (tid: TrackId, nid: string) => {
    setUi({ view: 'map', track: tid });
    setSelected(nid);
    setFocus({ track: tid, node: nid, n: Date.now() });
    setSearchOpen(false);
  };

  const exportProgress = () => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `recalldsa-roadmap-${localDay()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    pushToast('Progress exported as JSON');
  };

  const importProgress = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        replace(JSON.parse(String(reader.result)));
        pushToast('Progress imported');
      } catch {
        pushToast('That file is not valid progress JSON', true);
      }
    };
    reader.readAsText(file);
  };

  const onReset = () => {
    if (!confirm(`Reset all progress on "${track.name}"?`)) return;
    update((s) => resetTrack(s, trackId));
    pushToast('Track progress reset', true);
  };

  const sync = SYNC_LABEL[status];
  const SyncIcon = sync.icon;

  return (
    <div className="relative flex min-h-screen flex-col">
      <AnimatedBackground />
      <Header />

      <main className="container relative mx-auto max-w-7xl flex-1 space-y-6 px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between"
        >
          <div className="space-y-2">
            <p className="eyebrow">Learn</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Roadmap
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Six skill trees, two 30-day plans and a portfolio of projects, one place. Mark a
              topic done and the next one lights up.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 font-mono text-xs',
                sync.tone,
              )}
              title="Progress is stored on your account and cached on this device"
            >
              <SyncIcon
                className={cn('h-3.5 w-3.5', (status === 'loading' || status === 'saving') && 'animate-spin')}
              />
              {sync.text}
            </span>
            <Button type="button" variant="outline" size="sm" onClick={() => setSearchOpen(true)}>
              <Search className="h-3.5 w-3.5" />
              Search
              <kbd className="ml-1 rounded border border-border px-1 font-mono text-[0.625rem] text-muted-foreground">
                /
              </kbd>
            </Button>
          </div>
        </motion.div>

        <div
          role="tablist"
          aria-label="Roadmap section"
          className="inline-flex rounded-[var(--radius)] border border-border bg-surface p-1"
        >
          {VIEWS.map((v) => {
            const active = view === v.id;
            return (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setUi({ view: v.id })}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm transition-colors',
                  active
                    ? 'bg-primary-soft font-medium text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <v.icon className="h-3.5 w-3.5" />
                {v.label}
              </button>
            );
          })}
        </div>

        <div className={cn('transition-opacity', !hydrated && 'opacity-60')}>
          {view === 'map' && (
            <MapView
              key={trackId}
              track={track}
              trackId={trackId}
              progress={progress}
              selected={selected}
              focus={focus}
              onSelect={setSelected}
              onSelectTrack={(id) => {
                setSelected(null);
                setUi({ track: id });
              }}
              onToggleNode={(tid, nid) => update((s) => toggleNode(s, tid, nid))}
              onNote={(tid, nid, text) => update((s) => setNote(s, tid, nid, text))}
              onReset={onReset}
              onExport={exportProgress}
              onImport={importProgress}
            />
          )}
          {view === 'plans' && (
            <PlanView
              plan={plan}
              planId={planId}
              tasks={progress.plans[planId]?.tasks || {}}
              hoursPerDay={progress.settings.hoursPerDay}
              onSelectPlan={(id) => setUi({ plan: id })}
              onToggleTask={(pid, day, i) => update((s) => toggleTask(s, pid, day, i))}
              onHoursPerDay={(h) =>
                update((s) => ({ ...s, settings: { ...s.settings, hoursPerDay: h } }))
              }
            />
          )}
          {view === 'projects' && (
            <ProjectsView
              statuses={progress.projects}
              filter={progress.ui.projFilter || 'all'}
              onFilter={(id) => setUi({ projFilter: id })}
              onCycle={(id) => update((s) => cycleProject(s, id))}
            />
          )}
        </div>
      </main>

      {searchOpen && (
        <SearchPalette
          onClose={() => setSearchOpen(false)}
          onNode={jumpToNode}
          onProject={() => {
            setUi({ view: 'projects', projFilter: 'all' });
            setSearchOpen(false);
          }}
        />
      )}

      <div className="pointer-events-none fixed bottom-5 left-1/2 z-[90] flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="elevated-raised flex items-center gap-2.5 rounded-[var(--radius)] border border-border-strong bg-popover px-4 py-2.5 text-sm animate-slide-in-from-bottom"
          >
            <span className={cn('h-2 w-2 rounded-full', t.warn ? 'bg-warning' : 'bg-primary')} />
            {t.msg}
          </div>
        ))}
      </div>

      <Footer />
    </div>
  );
}
