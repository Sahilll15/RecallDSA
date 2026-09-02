'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_PROGRESS,
  mergeProgress,
  type RoadmapProgress,
} from '@/lib/roadmap/progress';

const LS_KEY = 'recalldsa-roadmap-v1';
const SAVE_DEBOUNCE_MS = 650;

export type SyncStatus = 'loading' | 'synced' | 'saving' | 'offline';

/**
 * Server is the source of truth; localStorage is a warm cache so the tree
 * paints before the round trip and survives a flaky connection. Every change
 * writes both, the server write debounced.
 */
export function useRoadmapProgress() {
  const [progress, setProgress] = useState<RoadmapProgress>(DEFAULT_PROGRESS);
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState<SyncStatus>('loading');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Skip the write that hydration itself triggers.
  const skipNextSave = useRef(true);

  useEffect(() => {
    let cancelled = false;
    let local: RoadmapProgress | null = null;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) local = mergeProgress(JSON.parse(raw));
    } catch {
      /* cache is optional */
    }
    if (local) setProgress(local);

    (async () => {
      try {
        const res = await fetch('/api/roadmap/state', { cache: 'no-store' });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { state: unknown | null };
        if (cancelled) return;
        if (data.state) {
          skipNextSave.current = true;
          setProgress(mergeProgress(data.state));
        } else if (local) {
          // First sign-in on this device: seed the server from the cache.
          await fetch('/api/roadmap/state', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state: local }),
          });
        }
        setStatus('synced');
      } catch {
        if (!cancelled) setStatus('offline');
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(progress));
    } catch {
      /* quota or private mode */
    }
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setStatus('saving');
    saveTimer.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/roadmap/state', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: progress }),
        });
        setStatus(res.ok ? 'synced' : 'offline');
      } catch {
        setStatus('offline');
      }
    }, SAVE_DEBOUNCE_MS);
  }, [progress, hydrated]);

  const update = useCallback((fn: (s: RoadmapProgress) => RoadmapProgress) => {
    setProgress((s) => fn(s));
  }, []);

  /** Replace everything, e.g. from an imported JSON export. */
  const replace = useCallback((next: unknown) => {
    setProgress(mergeProgress(next));
  }, []);

  return { progress, update, replace, hydrated, status };
}
