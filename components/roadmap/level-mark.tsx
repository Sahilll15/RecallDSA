import { LEVELS } from '@/lib/roadmap/catalog';
import type { Level } from '@/lib/roadmap/types';
import { cn } from '@/lib/utils';

export const LEVEL_TEXT: Record<Level, string> = {
  F: 'text-lv-f',
  C: 'text-lv-c',
  A: 'text-lv-a',
};

export const LEVEL_BG: Record<Level, string> = {
  F: 'bg-lv-f',
  C: 'bg-lv-c',
  A: 'bg-lv-a',
};

/** The rotated-square level marker used on nodes, in the drawer and in search. */
export function LevelMark({ level, className }: { level: Level; className?: string }) {
  return <span className={cn('rm-lv', className)} data-lv={level} title={LEVELS[level].label} />;
}
