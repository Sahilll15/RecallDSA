'use client';

import { useState } from 'react';
import { BookOpen, Check, ChevronRight, Hammer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MetricStrip } from '@/components/ui/metric-strip';
import { PROJECT_TIERS, PROJECTS, TRACKS } from '@/lib/roadmap/catalog';
import type { Project, ProjectStatus, ProjectTier } from '@/lib/roadmap/types';
import { cn } from '@/lib/utils';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'swe', label: 'Agentic AI' },
  { id: 'scratch', label: 'ML from scratch' },
  { id: 'prod', label: 'Production' },
  { id: 'hld', label: 'HLD' },
  { id: 'lld', label: 'LLD' },
  { id: 'dsa', label: 'DSA' },
] as const;

const TIER_BADGE: Record<ProjectTier, 'info' | 'warning' | 'success'> = {
  starter: 'info',
  core: 'warning',
  flagship: 'success',
};

interface ProjectsViewProps {
  statuses: Record<string, ProjectStatus>;
  filter: string;
  onFilter: (id: string) => void;
  onCycle: (projectId: string) => void;
}

export function ProjectsView({ statuses, filter, onFilter, onCycle }: ProjectsViewProps) {
  const list = PROJECTS.filter(
    (p) => filter === 'all' || p.tracks.includes(filter as Project['tracks'][number]),
  );
  const built = PROJECTS.filter((p) => statuses[p.id] === 'done');
  const building = PROJECTS.filter((p) => statuses[p.id] === 'building');

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="space-y-4">
        <div>
          <p className="eyebrow">Portfolio · what you can show, not just what you know</p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">Build proof</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Roadmap nodes teach concepts. These projects turn them into evidence. Starter projects
            wire the pieces together, core projects are the ones interviewers ask about, and a
            flagship anchors the portfolio.
          </p>
        </div>
        <MetricStrip
          columns={3}
          metrics={[
            { label: 'Built', value: `${built.length}/${PROJECTS.length}` },
            { label: 'In progress', value: building.length },
            {
              label: 'Build hours logged',
              value: `${built.reduce((s, p) => s + p.hours, 0)}h`,
            },
          ]}
        />
      </section>

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter projects by roadmap">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => onFilter(f.id)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              filter === f.id
                ? 'border-primary bg-primary-soft text-primary'
                : 'border-border text-muted-foreground hover:border-border-strong hover:text-foreground',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((p) => (
          <ProjectCard key={p.id} project={p} status={statuses[p.id]} onCycle={() => onCycle(p.id)} />
        ))}
      </div>
    </div>
  );
}

function ProjectCard({
  project: p,
  status,
  onCycle,
}: {
  project: Project;
  status?: ProjectStatus;
  onCycle: () => void;
}) {
  const [open, setOpen] = useState(false);
  const label = status === 'done' ? 'Built' : status === 'building' ? 'Building' : 'Start building';

  return (
    <article
      className={cn(
        'elevated flex flex-col gap-3 rounded-[var(--radius)] border bg-surface p-4 transition-colors',
        status === 'done' ? 'border-primary/40' : 'border-border hover:border-border-strong',
      )}
    >
      <div className="flex items-center justify-between">
        <Badge variant={TIER_BADGE[p.tier]}>{PROJECT_TIERS[p.tier].label}</Badge>
        <span className="font-mono text-xs text-muted-foreground" data-numeric>
          ~{p.hours}h
        </span>
      </div>
      <div>
        <h3 className="font-display text-base font-semibold leading-tight">{p.name}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.pitch}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {p.proves.map((s) => (
          <Badge key={s} variant="outline" className="font-normal">
            {s}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {p.stack.map((s) => (
          <Badge key={s} variant="code">
            {s}
          </Badge>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 self-start text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-90')} />
        {open ? 'Hide milestones' : `Milestones (${p.milestones.length})`}
      </button>
      {open && (
        <div className="space-y-2 rounded-[var(--radius)] border border-border bg-surface-raised p-3">
          <ol className="space-y-1.5 text-sm">
            {p.milestones.map((m, i) => (
              <li key={m} className="flex gap-2.5">
                <span className="w-5 shrink-0 font-mono text-xs text-muted-foreground" data-numeric>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="leading-snug">{m}</span>
              </li>
            ))}
          </ol>
          <p className="border-t border-border pt-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Stretch.</span> {p.stretch}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {p.res.map((r) => (
          <a
            key={r.u}
            href={r.u}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <BookOpen className="h-3 w-3" />
            {r.t}
          </a>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
        <span className="flex gap-1">
          {p.tracks.map((t) => (
            <span
              key={t}
              className="rounded border border-border px-1.5 py-0.5 font-mono text-[0.625rem] font-semibold tracking-wider text-muted-foreground"
            >
              {TRACKS[t].mono}
            </span>
          ))}
        </span>
        <Button
          type="button"
          size="sm"
          variant={status === 'done' ? 'default' : status === 'building' ? 'secondary' : 'outline'}
          onClick={onCycle}
          title="Click to cycle status"
        >
          {status === 'done' ? <Check className="h-3.5 w-3.5" /> : <Hammer className="h-3.5 w-3.5" />}
          {label}
        </Button>
      </div>
    </article>
  );
}
