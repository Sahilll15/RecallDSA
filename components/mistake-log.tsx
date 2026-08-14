'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';

export interface MistakeData {
  id: string;
  description: string;
  concept: string | null;
  createdAt: string;
}

interface MistakeLogProps {
  problemId: string;
  mistakes: MistakeData[];
  onChanged: () => void;
}

export function MistakeLog({ problemId, mistakes, onChanged }: MistakeLogProps) {
  const [description, setDescription] = useState('');
  const [concept, setConcept] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = async () => {
    if (!description.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/problems/${problemId}/mistakes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, concept: concept || undefined }),
      });
      if (!res.ok) throw new Error('Failed to record the mistake');
      setDescription('');
      setConcept('');
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to record the mistake');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      await fetch(`/api/mistakes/${id}`, { method: 'DELETE' });
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {mistakes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No mistakes recorded. When a review trips you up, write down exactly what went wrong
          and the underlying concept. Recurring concepts show up on your dashboard.
        </p>
      ) : (
        <div className="space-y-2">
          {mistakes.map((mistake) => (
            <div
              key={mistake.id}
              className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3"
            >
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm whitespace-pre-wrap">{mistake.description}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  {mistake.concept && (
                    <Badge variant="warning" className="text-xs">
                      {mistake.concept}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDate(mistake.createdAt)}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => remove(mistake.id)}
                disabled={busy}
                className="shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What went wrong? e.g. Forgot nums[i] / mid uses integer division"
        />
        <div className="flex gap-2">
          <Input
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="Concept (optional), e.g. ceiling division"
          />
          <Button onClick={add} disabled={busy || !description.trim()} variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
