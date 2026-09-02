'use client';

import { useRef } from 'react';
import { BookOpen, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MetricStrip } from '@/components/ui/metric-strip';
import { PLAN_ORDER, PLANS, type PlanWithMono } from '@/lib/roadmap/catalog';
import { summarizePlan, taskKey } from '@/lib/roadmap/progress';
import type { PlanId } from '@/lib/roadmap/types';
import { cn } from '@/lib/utils';

interface PlanViewProps {
  plan: PlanWithMono;
  planId: PlanId;
  tasks: Record<string, true>;
  hoursPerDay: number;
  onSelectPlan: (id: PlanId) => void;
  onToggleTask: (planId: PlanId, day: number, index: number) => void;
  onHoursPerDay: (h: number) => void;
}

export function PlanView({
  plan,
  planId,
  tasks,
  hoursPerDay,
  onSelectPlan,
  onToggleTask,
  onHoursPerDay,
}: PlanViewProps) {
  const sum = summarizePlan(plan, tasks, hoursPerDay);
  const currentRef = useRef<HTMLDivElement>(null);
  const dayDone = (d: PlanWithMono['days'][number]) =>
    d.tasks.every((_, i) => tasks[taskKey(d.d, i)]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="grid gap-3 sm:grid-cols-2" role="tablist" aria-label="Choose a plan">
        {PLAN_ORDER.map((id) => {
          const p = PLANS[id];
          const active = id === planId;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelectPlan(id)}
              className={cn(
                'elevated flex items-start gap-3 rounded-[var(--radius)] border bg-surface p-4 text-left transition-colors',
                active
                  ? 'border-primary ring-1 ring-primary/30'
                  : 'border-border hover:border-border-strong hover:bg-surface-raised',
              )}
            >
              <span className="mt-0.5 rounded border border-border bg-surface-raised px-1.5 py-0.5 font-mono text-[0.625rem] font-semibold tracking-wider text-muted-foreground">
                {p.mono}
              </span>
              <span className="min-w-0">
                <span className="block font-display text-sm font-semibold">{p.name}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                  {p.blurb}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <section className="space-y-4">
        <div>
          <p className="eyebrow">Resumable · saved automatically</p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">{plan.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{plan.blurb}</p>
        </div>

        <MetricStrip
          columns={4}
          metrics={[
            { label: 'Days done', value: `${sum.daysDone}/${sum.totalDays}` },
            { label: 'Tasks done', value: `${sum.tasksDone}/${sum.totalTasks}` },
            { label: 'Hours logged', value: `${sum.hoursDone}/${sum.totalHours}h` },
            {
              label: 'Est. finish',
              value:
                sum.finish === null
                  ? 'Done'
                  : sum.finish.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
              sub: sum.finish === null ? undefined : `${sum.calendarDays} days at ${hoursPerDay}h/day`,
              tone: sum.finish === null ? 'text-primary' : undefined,
            },
          ]}
        />

        <div className="elevated flex flex-wrap items-center gap-4 rounded-[var(--radius)] border border-border bg-surface px-4 py-3">
          <label htmlFor="rm-pace" className="text-sm font-medium">
            Study pace
          </label>
          <input
            id="rm-pace"
            type="range"
            min={1}
            max={8}
            step={0.5}
            value={hoursPerDay}
            onChange={(e) => onHoursPerDay(Number(e.target.value))}
            className="h-1.5 min-w-[160px] flex-1 cursor-pointer accent-[hsl(var(--primary))]"
          />
          <span className="font-mono text-xs text-muted-foreground" data-numeric>
            {hoursPerDay} h / day
          </span>
          {sum.currentDay !== null && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
              className="ml-auto"
            >
              Resume · Day {sum.currentDay}
            </Button>
          )}
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${sum.totalTasks ? (sum.tasksDone / sum.totalTasks) * 100 : 0}%` }}
          />
        </div>
      </section>

      <div className="space-y-3">
        {plan.days.map((day) => {
          const finished = dayDone(day);
          const isCurrent = sum.currentDay === day.d;
          return (
            <article
              key={day.d}
              ref={isCurrent ? currentRef : null}
              className={cn(
                'elevated overflow-hidden rounded-[var(--radius)] border bg-surface',
                finished ? 'border-primary/40' : 'border-border',
                isCurrent && 'border-warning ring-1 ring-warning/25',
              )}
            >
              <header className="flex items-center gap-4 border-b border-border px-4 py-3">
                <div
                  className={cn(
                    'flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md border font-mono leading-none',
                    finished
                      ? 'border-primary/40 bg-primary-soft text-primary'
                      : 'border-border bg-surface-raised text-muted-foreground',
                  )}
                >
                  <span className="text-base font-semibold" data-numeric>
                    {String(day.d).padStart(2, '0')}
                  </span>
                  <span className="mt-0.5 text-[0.5625rem] tracking-widest">DAY</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-semibold">{day.title}</p>
                  <p className="text-xs text-muted-foreground">{day.focus}</p>
                </div>
                <span className="font-mono text-xs text-muted-foreground" data-numeric>
                  ~{day.hours}h
                </span>
              </header>
              <div className="space-y-0.5 p-2">
                {day.tasks.map((task, i) => {
                  const checked = !!tasks[taskKey(day.d, i)];
                  return (
                    <button
                      key={i}
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      onClick={() => onToggleTask(planId, day.d, i)}
                      className="flex w-full items-start gap-3 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-accent/60"
                    >
                      <span
                        className={cn(
                          'mt-px grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors',
                          checked
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border-strong',
                        )}
                      >
                        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      <span
                        className={cn(
                          'text-sm leading-snug',
                          checked && 'text-muted-foreground line-through decoration-primary/60',
                        )}
                      >
                        {task}
                      </span>
                    </button>
                  );
                })}
              </div>
              {day.res && day.res.length > 0 && (
                <div className="flex flex-wrap gap-2 border-t border-border px-4 py-2.5">
                  {day.res.map((r) => (
                    <a
                      key={r.u}
                      href={r.u}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      {r.t}
                    </a>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
