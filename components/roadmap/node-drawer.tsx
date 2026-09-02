'use client';

import { useEffect } from 'react';
import { ArrowUpRight, BookOpen, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LEVELS } from '@/lib/roadmap/catalog';
import type { TrackNode } from '@/lib/roadmap/types';
import { cn } from '@/lib/utils';
import { LevelMark } from './level-mark';

interface NodeDrawerProps {
  node: TrackNode | null;
  done: boolean;
  note: string;
  onNote: (text: string) => void;
  onClose: () => void;
  onToggle: () => void;
}

export function NodeDrawer({ node, done, note, onNote, onClose, onToggle }: NodeDrawerProps) {
  const open = node !== null;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-[55] bg-background/60 backdrop-blur-[2px] transition-opacity duration-200',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <aside
        aria-hidden={!open}
        aria-label={node ? node.t : 'Topic details'}
        className={cn(
          'fixed inset-y-0 right-0 z-[60] flex w-[400px] max-w-[92vw] flex-col border-l border-border bg-surface elevated-raised transition-transform duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)]',
          open ? 'translate-x-0' : 'translate-x-[102%]',
        )}
      >
        {node && (
          <>
            <div className="relative border-b border-border px-6 pb-5 pt-5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-3 top-3 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-medium">
                  <LevelMark level={node.lv} />
                  {LEVELS[node.lv].label}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="font-mono text-xs text-muted-foreground" data-numeric>
                  ~{node.h} hours
                </span>
              </div>
              <h2 className="pr-8 font-display text-2xl font-semibold leading-tight tracking-tight">
                {node.t}
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{node.s}</p>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              <section className="space-y-2">
                <p className="eyebrow">What you&apos;ll learn</p>
                <ul className="space-y-1.5 text-sm">
                  {node.learn.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <span className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full bg-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="space-y-2">
                <p className="eyebrow">Tools and tech</p>
                <div className="flex flex-wrap gap-1.5">
                  {node.tools.map((tool) => (
                    <Badge key={tool} variant="code">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </section>

              <section className="space-y-2">
                <p className="eyebrow">Build this</p>
                <p className="rounded-[var(--radius)] border border-border bg-surface-raised px-3.5 py-3 text-sm leading-relaxed">
                  {node.proj}
                </p>
              </section>

              <section className="space-y-2">
                <label htmlFor="rm-note" className="eyebrow block">
                  My notes
                </label>
                <textarea
                  id="rm-note"
                  rows={3}
                  value={note}
                  onChange={(e) => onNote(e.target.value)}
                  placeholder="Anything worth remembering about this topic. Saved with your progress."
                  className="w-full resize-y rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-sm leading-relaxed placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </section>

              <section className="space-y-2">
                <p className="eyebrow">Resources and videos</p>
                <div className="space-y-1.5">
                  {node.res.map((r) => (
                    <a
                      key={r.u}
                      href={r.u}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 rounded-[var(--radius)] border border-border bg-surface px-3 py-2.5 text-sm transition-colors hover:border-border-strong hover:bg-surface-raised"
                    >
                      <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1">{r.t}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                    </a>
                  ))}
                </div>
              </section>
            </div>

            <div className="border-t border-border px-6 py-4">
              <Button
                type="button"
                size="lg"
                variant={done ? 'outline' : 'default'}
                onClick={onToggle}
                className="w-full"
              >
                <Check className="h-4 w-4" />
                {done ? 'Completed. Mark as not done' : 'Mark as complete'}
              </Button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
